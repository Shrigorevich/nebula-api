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

  async saveLastBytePosition(taskId: string, index: number, position: number) {
    await this.redis.set(
      `last-position:taskId:${taskId}:index:${index}`,
      position,
    );
  }

  async getLastBytePosition(
    taskId: string,
    index: number,
  ): Promise<number | null> {
    const pos = await this.redis.get(
      `last-position:taskId:${taskId}:index:${index}`,
    );
    return pos ? Number(pos) : null;
  }

  async saveUploadUrl(taskId: string, index: number, url: string) {
    await this.redis.set(`url:taskId:${taskId}:index:${index}`, url);
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
