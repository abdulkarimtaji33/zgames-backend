import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSale } from './entities/flash-sale.entity';
import { FlashSaleProduct } from './entities/flash-sale-product.entity';
import { FlashSalesService } from './flash-sales.service';
import { FlashSalesController } from './flash-sales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSale, FlashSaleProduct])],
  providers: [FlashSalesService],
  controllers: [FlashSalesController],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}
