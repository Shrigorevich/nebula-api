import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigProviderModule } from './configuration/configuration.module';
import { UploadModule } from './uploader/uploader.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigProviderModule,
    UploadModule,
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
  ],
})
export class AppModule {}
