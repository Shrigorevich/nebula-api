import { Controller, Delete, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DriveServiceGoogle } from './drive.service.google';

@Controller('api/v1/files')
@ApiTags('drives (for testing)')
export class DriveController {
  constructor(private readonly driveService: DriveServiceGoogle) {}

  @Get()
  async getList(): Promise<string> {
    return await this.driveService.getFiles();
  }

  @Delete()
  async deleteAll(): Promise<void> {
    return await this.driveService.clearDrive();
  }

  @Get('download-link')
  async getLink(): Promise<string> {
    return await this.driveService.getResumableUploadUrl(
      'super-file.mp4',
      'video/mp4',
    );
  }
}
