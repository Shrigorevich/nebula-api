import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The file URLs to be uploaded',
    example: '["https://placehold.co/600x400"]', // Request example
  })
  urls: string[];
}

export class CloudFileDto {
  id: number;
  name: string;
  size: number;
  link: string;
}
