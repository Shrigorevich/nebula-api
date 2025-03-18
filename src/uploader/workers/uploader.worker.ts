import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import {
  JobQueue,
  JobType,
  NonResumableUploadJob,
  ResumableUploadJob,
  TaskStatus,
  UploadJob,
} from '../uploader.models';
import { getFileMeta } from './uploader.utils';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class UploadWorker implements OnModuleInit, OnModuleDestroy {
  private readonly resumableQueue: Queue;
  private readonly nonResumableQueue: Queue;
  private worker: Worker;

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly cache: CacheService,
  ) {
    this.resumableQueue = new Queue(JobQueue.ResumableUploading, {
      connection: this.configProvider.redisConnection(),
    });
    this.nonResumableQueue = new Queue(JobQueue.NonResumableUploading, {
      connection: this.configProvider.redisConnection(),
    });
  }

  private async handleJob(job: Job<UploadJob>): Promise<void> {
    const { taskId: taskId, url, index } = job.data;
    try {
      const { name, mime, resumable, size } = await getFileMeta(
        url,
        taskId,
        index,
      );

      if (resumable && size) {
        await this.scheduleJob<ResumableUploadJob>(
          this.resumableQueue,
          JobType.ResumableUploadTask,
          {
            ...job.data,
            file: { name, mime, size },
          },
        );
      } else {
        await this.scheduleJob<NonResumableUploadJob>(
          this.nonResumableQueue,
          JobType.NonResumableUploadTask,
          {
            ...job.data,
            file: { name, mime },
          },
        );
      }
    } catch (error) {
      console.error(
        `Error during upload task setup. Attempt: ${job.attemptsMade}`,
        error,
      );
      if (job.attemptsMade + 1 === job.opts.attempts) {
        this.cache.saveTaskUnit(taskId, index, TaskStatus.Error);
      }
      throw error;
    }
  }

  private async scheduleJob<T>(queue: Queue, type: JobType, payload: T) {
    await queue.add(type, payload, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 3000,
      },
    });
  }

  async onModuleInit() {
    this.worker = new Worker(
      JobQueue.InitUploading,
      async (job: Job<UploadJob>) => this.handleJob(job),
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
    console.log('Stopping uploading Worker...');
    await this.worker.close();
  }
}
