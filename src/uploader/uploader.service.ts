import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { TaskQueue, UploadTaskFile } from 'src/task/task.models';

@Injectable()
export class UploadService {
  private queue: Queue;

  constructor(private readonly configProvider: ConfigProvider) {
    this.queue = new Queue(TaskQueue.Uploading, {
      connection: this.configProvider.redisConnection(),
    });
  }

  async addUploadTask(file: UploadTaskFile): Promise<void> {
    await this.queue.add('upload-task', file);
  }
}
