import { Module } from '@nestjs/common';
import { DownloadService } from './downloader.service';
import { DownloadWorker } from './downloader.worker';
import { ConfigProviderModule } from 'src/configuration/configuration.module';

@Module({
  imports: [ConfigProviderModule],
  exports: [DownloadService],
  providers: [DownloadService, DownloadWorker],
})
export class DownloadModule {}
