import { Controller, Delete, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DriveServiceGoogle } from './drive.service.google';
import { DriveFileDto } from './drive.dto';

@Controller('api/v1/files')
@ApiTags('drives (for testing)')
export class DriveController {
  constructor(private readonly driveService: DriveServiceGoogle) {}

  @Get()
  async getList(): Promise<DriveFileDto[]> {
    return await this.driveService.getFiles();
  }

  @Delete()
  async deleteAll(): Promise<void> {
    return await this.driveService.clearDrive();
  }
}
