import axios, {
  AxiosHeaders,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
} from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import {
  DownloadTaskFile,
  FileEvent,
  FileEventType,
  TaskQueue,
} from 'src/task/task.models';
import { ConfigProvider } from 'src/configuration/configuration.provider';

@Injectable()
export class DownloadWorker implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;
  private worker: Worker;

  constructor(private readonly configProvider: ConfigProvider) {
    this.queue = new Queue(TaskQueue.EventQueue, {
      connection: this.configProvider.redisConnection(),
    });
  }

  async onModuleInit() {
    this.worker = new Worker(
      TaskQueue.Downloading,
      async (job: Job<DownloadTaskFile>) => this.handleDownloading(job),
      {
        connection: this.configProvider.redisConnection(),
      },
    );
  }

  async onModuleDestroy() {
    console.log('Stopping downloading Worker...');
    await this.worker.close();
  }

  private async handleDownloading(job: Job<DownloadTaskFile>): Promise<void> {
    const { taskId, index, url, dir } = job.data;
    const event: FileEvent = {
      type: FileEventType.Downloaded,
      index: index,
      taskId: taskId,
      result: false,
      data: '',
    };

    try {
      const response = await axios.get(url, {
        responseType: 'stream',
      });
      const filePath = path.join(
        dir,
        this.getFileName(response.headers, index),
      );
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      event.result = await this.isDownloaded(writer);
      event.data = filePath;
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      await this.queue.add('event', event);
    }
  }

  private async isDownloaded(writer: fs.WriteStream): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      writer.on('finish', () => {
        resolve(true);
      });
      writer.on('error', (err) => {
        console.error('Error downloading file:', err);
        resolve(true);
      });
    });
  }

  private getFileName(
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
    index: number,
  ) {
    try {
      if (headers instanceof AxiosHeaders) {
        console.log(headers);
        const contentType = headers['content-type'];
        console.log(mime.getExtension(contentType as string));
        const extension = contentType
          ? mime.getExtension(contentType as string)
          : '';
        return `file-${index}.${extension}`;
      }
      return `file-${index}`;
    } catch {
      return `file-${index}`;
    }
  }
}
