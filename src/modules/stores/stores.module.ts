import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreLocation } from './entities/store-location.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreLocation])],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
