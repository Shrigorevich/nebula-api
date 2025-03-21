import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  ResumableUploadJob,
  JobQueue,
  TaskStatus,
  ResumableFileMeta,
} from '../uploader.models';
import { Job, Worker } from 'bullmq';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { DriveServiceGoogle } from 'src/drive/drive.service.google';
import { Readable } from 'stream';
import axios from 'axios';
import { CacheService } from 'src/cache/cache.service';
import { UploadingStatus } from 'src/drive/drive.models';
import { UploadService } from '../uploader.service';

@Injectable()
export class ResumableUploadWorker implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly driveService: DriveServiceGoogle,
    private readonly cache: CacheService,
    private readonly uploadService: UploadService,
  ) {}

  private async handleJob(job: Job<ResumableUploadJob>): Promise<void> {
    const { taskId, url, index, file } = job.data;
    console.log(
      `Resumable Upload job initiated. Task: ${taskId}. Index: ${index}. Attempt: ${job.attemptsMade}`,
    );
    try {
      this.cache.saveTaskUnit(taskId, index, TaskStatus.InProgress);
      const uploadUrl = await this.retrieveUploadUrl(
        taskId,
        index,
        file.name,
        file.mime,
      );

      const lastBytePos = await this.cache.getLastBytePosition(taskId, index);
      console.log('Last position: ' + lastBytePos);
      if (lastBytePos && lastBytePos > 0) {
        console.log(`Uploading is resumed. Task: ${taskId}. Index: ${index}.`);
        const status = await this.driveService.getUploadingStatus(uploadUrl);
        if (status.completed) {
          console.log(
            `Uploading was already done. Go to finalize. Task: ${taskId}. Index: ${index}.`,
          );
          const downloadLink = await this.driveService.getDownloadLink(
            status.fileId!,
          );
          await this.finalize(
            taskId,
            index,
            file,
            downloadLink,
            status.fileId!,
          );
          return;
        }
        const { downloadLink, fileId } = await this.streamFile(
          job.data,
          url,
          uploadUrl,
          file.size,
          status.uploadedSize!,
        );
        await this.finalize(taskId, index, file, downloadLink, fileId);
        console.log(`Uploading completed. Task: ${taskId}. Index: ${index}.`);
        return;
      }

      console.log(`Uploading started. TaskId: ${taskId}. IndexId: ${index}`);
      const { downloadLink, fileId } = await this.streamFile(
        job.data,
        url,
        uploadUrl,
        file.size,
        0,
      );
      await this.finalize(taskId, index, file, downloadLink, fileId);
      console.log(`Uploading finished. TaskId: ${taskId}. IndexId: ${index}`);
      // Resume failed uploading
    } catch (error) {
      console.error(
        `Error during ResumableUpload processing. Attempt: ${job.attemptsMade}. Limit: ${job.opts.attempts}.`,
        error,
      );
      if (job.attemptsMade + 1 === job.opts.attempts) {
        this.cache.saveTaskUnit(taskId, index, TaskStatus.Error);
      }
      throw error;
    }
  }

  private async streamFile(
    state: ResumableUploadJob,
    sourceUrl: string,
    uploadUrl: string,
    fileSize: number,
    initOffset: number,
  ): Promise<{
    downloadLink: string;
    fileId: string;
  }> {
    const CHUNK_SIZE = this.configProvider.chunkSize() * 1024 * 1024;
    let startPos = initOffset;
    let uploadingStatus: UploadingStatus = {
      completed: false,
    };

    while (startPos < fileSize) {
      const endPos = Math.min(startPos + CHUNK_SIZE - 1, fileSize - 1);

      console.log(
        `Chunk uploading: ${startPos}-${endPos}. Progress: ${(startPos / fileSize) * 100}`,
      );
      const res = await axios.get<Readable>(sourceUrl, {
        responseType: 'stream',
        headers: {
          Range: `bytes=${startPos}-${endPos}`,
        },
      });

      uploadingStatus = await this.driveService.uploadChunk(
        uploadUrl,
        res.data,
        startPos,
        endPos,
        fileSize,
      );

      await this.cache.saveLastBytePosition(state.taskId, state.index, endPos);
      startPos = endPos + 1;
    }
    if (uploadingStatus.completed) {
      const link = await this.driveService.getDownloadLink(
        uploadingStatus.fileId!,
      );
      return {
        downloadLink: link,
        fileId: uploadingStatus.fileId!,
      };
    }
    throw new Error('Uploading synchronization error');
  }

  private async finalize(
    taskId: string,
    index: number,
    file: ResumableFileMeta,
    link: string,
    fileId: string,
  ) {
    await this.driveService.makeFilePublic(fileId);
    await this.uploadService.saveFile(file.name, file.size, link);
    await this.cache.saveTaskUnit(taskId, index, TaskStatus.Done);
  }

  private async retrieveUploadUrl(
    taskId: string,
    index: number,
    fileName: string,
    fileMime: string,
  ): Promise<string> {
    let uploadUrl: string | null = await this.cache.getUploadUrl(taskId, index);
    if (uploadUrl) {
      console.log(
        `Upload url was found in cache. TaskId: ${taskId}. Index: ${index}`,
      );
    }
    if (!uploadUrl) {
      console.log(
        `No upload url in cache. Requesting new one. TaskId: ${taskId}. Index: ${index}`,
      );
      uploadUrl = await this.driveService.createResumableUploadUrl(
        fileName,
        fileMime,
      );
    }
    await this.cache.saveUploadUrl(taskId, index, uploadUrl);
    return uploadUrl!;
  }

  async onModuleInit() {
    this.worker = new Worker(
      JobQueue.ResumableUploading,
      async (job: Job<ResumableUploadJob>) => this.handleJob(job),
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
