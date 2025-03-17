import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { FileEvent, TaskQueue } from 'src/task/task.models';

@Injectable()
export class TaskWorker implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;
  private worker: Worker;

  constructor(private readonly configProvider: ConfigProvider) {
    this.queue = new Queue(TaskQueue.EventQueue, {
      connection: configProvider.redisConnection(),
    });
  }

  async onModuleInit() {
    this.worker = new Worker(
      TaskQueue.EventQueue,
      async (job: Job<FileEvent>) => this.handleFileEvent(job),
      {
        connection: this.configProvider.redisConnection(),
      },
    );
  }

  async onModuleDestroy() {
    console.log('Stopping downloading Worker...');
    await this.worker.close();
  }

  private async handleFileEvent(job: Job<FileEvent>): Promise<void> {
    const { taskId, result, data, type } = job.data;

    if (!result) {
      return;
    }
  }
}
