import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
