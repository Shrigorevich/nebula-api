import { Module } from '@nestjs/common';
import { UploadService } from './uploader.service';
import { UploadWorker } from './uploader.worker';
import { GoogleDriveUploader } from './uploader.googledrive';
import { ConfigProviderModule } from 'src/configuration/configuration.module';

@Module({
  imports: [ConfigProviderModule],
  exports: [UploadService],
  providers: [UploadService, UploadWorker, GoogleDriveUploader],
})
export class UploadModule {}
