import { Injectable } from '@nestjs/common';
import {
  AppConfiguration,
  PgConnection,
  RedisConnConfig,
} from './configuration.models';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigProvider {
  readonly config: AppConfiguration;

  constructor(private readonly service: ConfigService) {
    this.config = {
      redisConnection: {
        host: this.service.getOrThrow<string>('REDIS_HOST'),
        port: this.service.getOrThrow<number>('REDIS_PORT'),
      },
      pgConnection: {
        host: this.service.getOrThrow<string>('POSTGRES_HOST'),
        user: this.service.getOrThrow<string>('POSTGRES_USER'),
        password: this.service.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: this.service.getOrThrow<string>('POSTGRES_DATABASE'),
        port: this.service.getOrThrow<number>('POSTGRES_PORT'),
      },
      google: {
        credentialsFile: this.service.getOrThrow<string>('GOOGLE_CRED_FILE'),
      },
      chunkSize: this.service.getOrThrow<number>('CHUNK_SIZE'),
    };
    console.log(this.config);
  }

  redisConnection(): RedisConnConfig {
    return this.config.redisConnection;
  }

  googleCredFile(): string {
    return this.config.google.credentialsFile;
  }

  chunkSize(): number {
    return this.config.chunkSize;
  }

  pgConnection(): PgConnection {
    return this.config.pgConnection;
  }
}
