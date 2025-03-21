import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The file URLs to be uploaded',
    example: '["https://placehold.co/600x400"]', // Request example
  })
  urls: string[];
}

export class TaskStatusDto {
  [key: string]: number;
}

export class CloudFileDto {
  @ApiProperty({
    description: 'File ID',
    example: 1, // Request example
  })
  id: number;
  @ApiProperty({
    description: 'File name',
    example: '67c7bf35-56b7-4712-a498-140b01aedf44-1.pdf', // Request example
  })
  name: string;
  @ApiProperty({
    description: 'File size in bytes',
    example: '52342634', // Request example
  })
  size: number;

  @ApiProperty({
    description: 'File download link ',
    example: 'http://cloud.com/file.pdf', // Request example
  })
  link: string;
}
