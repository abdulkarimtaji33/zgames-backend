import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyTransaction, Customer])],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
