import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { v4 as uuidv4 } from 'uuid';
import { JobQueue, TaskStatus, UploadJob } from './uploader.models';
import { UploaderContext } from './uploader.context';
import { CacheService } from 'src/cache/cache.service';
import { TaskStatusDto } from './uploader.dto';

@Injectable()
export class UploadService {
  private queue: Queue;

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly context: UploaderContext,
    private readonly cache: CacheService,
  ) {
    this.queue = new Queue(JobQueue.InitUploading, {
      connection: this.configProvider.redisConnection(),
    });
  }

  async getTaskStatus(id: string): Promise<TaskStatusDto> {
    const subStatuses = await this.cache.getTaskUnits(id);
    const statusCount = subStatuses.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return statusCount;
  }

  async saveFile(name: string, size: number, link: string) {
    await this.context.saveCloudFile(name, size, link);
  }

  async getFiles() {
    return await this.context.getCloudFiles();
  }

  async upload(urls: string[]): Promise<string> {
    const taskId = uuidv4();

    await Promise.all(
      urls.map(async (url, i) => {
        await this.cache.saveTaskUnit(taskId, i, TaskStatus.Pending);
        return await this.addUploadTask({ taskId, index: i, url });
      }),
    );

    return taskId;
  }

  async addUploadTask(task: UploadJob): Promise<void> {
    await this.queue.add('upload-init-task', task, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 3000,
      },
    });
  }
}
