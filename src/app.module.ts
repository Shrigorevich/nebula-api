import { Module } from '@nestjs/common';
import { DownloadModule } from './downloader/downloader.module';
import { TaskModule } from './task/task.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigProviderModule } from './configuration/configuration.module';
import { UploadModule } from './uploader/uploader.module';

@Module({
  imports: [
    ConfigProviderModule,
    DownloadModule,
    UploadModule,
    TaskModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
