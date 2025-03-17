import { Module } from '@nestjs/common';
import { ConfigProvider } from './configuration.provider';

@Module({
  exports: [ConfigProvider],
  providers: [ConfigProvider],
})
export class ConfigProviderModule {}
