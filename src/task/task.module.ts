import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { DownloadModule } from 'src/downloader/downloader.module';
import { TaskController } from './task.controller';

@Module({
  imports: [DownloadModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
