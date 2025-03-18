import { Module } from '@nestjs/common';
import { UploadService } from './uploader.service';
import { UploadWorker } from './workers/uploader.worker';
import { ConfigProviderModule } from 'src/configuration/configuration.module';
import { UploadController } from './uploader.controller';
import { ResumableUploadWorker } from './workers/uploader.resumable.worker';
import { NonResumableUploadWorker } from './workers/uploader.nonresumable.worker';
import { DriveModule } from 'src/drive/drive.module';
import { UploaderContext } from './uploader.context';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [ConfigProviderModule, DriveModule, CacheModule],
  controllers: [UploadController],
  exports: [UploadService],
  providers: [
    UploadService,
    UploadWorker,
    ResumableUploadWorker,
    NonResumableUploadWorker,
    UploaderContext,
  ],
})
export class UploadModule {}
