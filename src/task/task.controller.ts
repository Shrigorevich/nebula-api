import { Body, Controller, Get, Post } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './task.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('api/v1/task')
@ApiTags('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() body: CreateTaskDto): Promise<string> {
    await this.taskService.processFiles(body.urls);
    return 'success';
  }
}
