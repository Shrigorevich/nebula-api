import { Module } from '@nestjs/common';
import { DriveServiceGoogle } from './drive.service.google';
import { ConfigProviderModule } from 'src/configuration/configuration.module';
import { DriveController } from './drive.controller';

@Module({
  controllers: [DriveController],
  imports: [ConfigProviderModule],
  exports: [DriveServiceGoogle],
  providers: [DriveServiceGoogle],
})
export class DriveModule {}
