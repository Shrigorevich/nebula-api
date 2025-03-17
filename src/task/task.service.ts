import { Injectable } from '@nestjs/common';
import { DownloadService } from 'src/downloader/downloader.service';
import { DownloadTaskFile, FileSyncTask } from './task.models';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Injectable()
export class TaskService {
  constructor(private readonly downloader: DownloadService) {}

  async processFiles(urls: string[]) {
    try {
      const task: FileSyncTask = {
        id: uuidv4(),
        hash: '',
        status: 1,
      };

      const dir = await this.createDir(task.id);
      const taskFiles: DownloadTaskFile[] = urls.map((url, i) => ({
        taskId: task.id,
        url,
        dir,
        index: i,
      }));

      taskFiles.forEach(async (tf) => {
        await this.downloader.addDownloadTask(tf);
      });
    } catch (exception) {
      console.error(exception);
    }
  }

  private async createDir(taskId: string): Promise<string> {
    const dirPath = `./downloads-${taskId}`;
    await fs.promises.mkdir(dirPath, { recursive: true });
    return dirPath;
  }
}
