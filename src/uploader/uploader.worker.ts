import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import {
  FileEvent,
  FileEventType,
  TaskQueue,
  UploadTaskFile,
} from 'src/task/task.models';

@Injectable()
export class UploadWorker implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;
  private worker: Worker;

  constructor(private readonly configProvider: ConfigProvider) {
    this.queue = new Queue(TaskQueue.EventQueue, {
      connection: this.configProvider.redisConnection(),
    });
  }

  async onModuleInit() {
    this.worker = new Worker(
      TaskQueue.Uploading,
      async (job: Job<UploadTaskFile>) => this.handleUploading(job),
      {
        connection: this.configProvider.redisConnection(),
      },
    );
  }

  async onModuleDestroy() {
    console.log('Stopping downloading Worker...');
    await this.worker.close();
  }

  private async handleUploading(job: Job<UploadTaskFile>): Promise<void> {
    const { taskId, index, path } = job.data;
    const event: FileEvent = {
      type: FileEventType.Downloaded,
      index: index,
      taskId: taskId,
      result: false,
      data: '',
    };

    try {
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      await this.queue.add('event', event);
    }
  }
}
