// src/task/task.context.ts
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { CloudFileDto } from './uploader.dto';
import { ConfigProvider } from 'src/configuration/configuration.provider';

@Injectable()
export class UploaderContext {
  private pool: Pool;

  constructor(private readonly configProvider: ConfigProvider) {
    this.pool = new Pool(configProvider.pgConnection());
  }

  // Method to save a task
  async saveCloudFile(name: string, size: number, link: string): Promise<void> {
    const query = `
      INSERT INTO cloud_file (name, size, link) VALUES ($1, $2, $3);
    `;
    const values = [name, size, link];

    const result = await this.pool.query(query, values);
  }

  async getCloudFiles(): Promise<CloudFileDto[]> {
    const query = `SELECT id, name, size, link FROM cloud_file`;
    const result = await this.pool.query(query);
    return result.rows;
  }
}
