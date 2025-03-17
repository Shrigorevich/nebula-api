import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfiguration, RedisConnConfig } from './configuration.models';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class ConfigProvider {
  readonly config: AppConfiguration;
  constructor(private readonly service: ConfigService) {
    this.config = {
      redisConnection: {
        host: this.service.getOrThrow<string>('REDIS_HOST'),
        port: this.service.getOrThrow<number>('REDIS_PORT'),
      },
      google: {
        credentialsFile: this.service.getOrThrow<string>('GOOGLE_CRED_FILE'),
      },
    };
  }

  redisConnection(): RedisConnConfig {
    return this.config.redisConnection;
  }

  googleCredFile(): string {
    return this.config.google.credentialsFile;
  }
}
