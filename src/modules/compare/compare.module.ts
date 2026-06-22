import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompareList } from './entities/compare-list.entity';
import { CompareService } from './compare.service';
import { CompareController } from './compare.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompareList])],
  providers: [CompareService],
  controllers: [CompareController],
  exports: [CompareService],
})
export class CompareModule {}
