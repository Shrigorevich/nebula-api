import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { DownloadTaskFile, TaskQueue } from 'src/task/task.models';

@Injectable()
export class DownloadService {
  private readonly queue: Queue;

  constructor(private readonly configProvider: ConfigProvider) {
    this.queue = new Queue(TaskQueue.Downloading, {
      connection: this.configProvider.redisConnection(),
    });
  }

  async addDownloadTask(file: DownloadTaskFile): Promise<void> {
    await this.queue.add('download-task', file);
  }
}
