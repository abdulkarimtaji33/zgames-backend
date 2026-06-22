import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Return } from './entities/return.entity';
import { ReturnItem } from './entities/return-item.entity';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Return, ReturnItem])],
  providers: [ReturnsService],
  controllers: [ReturnsController],
  exports: [ReturnsService],
})
export class ReturnsModule {}
