import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ConfigProvider } from 'src/configuration/configuration.provider';
import { ConfigProviderModule } from 'src/configuration/configuration.module';

@Module({
  imports: [ConfigProviderModule],
  exports: [CacheService],
  providers: [CacheService],
})
export class CacheModule {}
