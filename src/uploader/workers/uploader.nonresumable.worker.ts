import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  NonResumableUploadJob,
  JobQueue,
  TaskStatus,
} from '../uploader.models';
import { Job, Worker } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { DriveServiceGoogle } from 'src/drive/drive.service.google';
import { Readable } from 'stream';
import axios from 'axios';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class NonResumableUploadWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly driveService: DriveServiceGoogle,
    private readonly cache: CacheService,
  ) {}

  private async handleJob(job: Job<NonResumableUploadJob>): Promise<void> {
    const { taskId, url, index, file } = job.data;
    try {
      console.log('Non resumable task initiated. ', job.data.index);

      const response = await axios.get<Readable>(url);
      if (!response.data)
        throw new Error('Provided url has no any content to read');

      const fileId = await this.driveService.streamToDrive(
        response.data,
        file.name,
        file.mime,
      );
    } catch (error) {
      console.error(
        `Error during Resumable upload processing. Attempt: ${job.attemptsMade}`,
        error,
      );
      if (job.attemptsMade + 1 === job.opts.attempts) {
        this.cache.saveTaskUnit(taskId, index, TaskStatus.Error);
      }
      throw error;
    }
  }

  async onModuleInit() {
    this.worker = new Worker(
      JobQueue.NonResumableUploading,
      async (job: Job<NonResumableUploadJob>) => this.handleJob(job),
      {
        connection: this.configProvider.redisConnection(),
        concurrency: 3,
        removeOnComplete: {
          count: 0,
        },
      },
    );
  }

  async onModuleDestroy() {
    console.log('Stopping non-resumable uploading Worker...');
    await this.worker.close();
  }
}
