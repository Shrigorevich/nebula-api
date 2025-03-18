import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CloudFileDto, CreateTaskDto } from './uploader.dto';
import { UploadService } from './uploader.service';

@Controller('api/v1/uploads')
@ApiTags('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  async createTask(@Body() body: CreateTaskDto): Promise<string> {
    return await this.uploadService.upload(body.urls);
  }

  @Get(':id/status')
  async getTask(@Param('id') id: string): Promise<string> {
    return await this.uploadService.getTaskStatus(id);
  }

  @Get('files')
  async getTaskStatus(): Promise<CloudFileDto[]> {
    return await this.uploadService.getFiles();
  }
}
