import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { TaskStatus } from 'src/uploader/uploader.models';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  constructor(private readonly configProvider: ConfigProvider) {
    this.redis = new Redis(
      this.configProvider.redisConnection().port,
      this.configProvider.redisConnection().host,
    );
  }

  async saveUploadUrl(taskId: string, index: number, url: string) {
    await this.redis.set(`url:task:${taskId}:index:${index}`, url);
  }

  async getUploadUrl(taskId: string, index: number): Promise<string | null> {
    return await this.redis.get(`url:taskId:${taskId}:index:${index}`);
  }

  async saveTaskUnit(taskId: string, index: number, status: TaskStatus) {
    await this.redis.set(`task:${taskId}:index:${index}`, status);
  }

  async getTaskUnits(taskId: string): Promise<TaskStatus[]> {
    const keys = await this.redis.keys(`task:${taskId}:index:*`);

    if (keys.length === 0) return [];
    const values: TaskStatus[] = (await this.redis.mget(...keys)).map(
      (value) => value as TaskStatus,
    );

    return values;
  }
}
