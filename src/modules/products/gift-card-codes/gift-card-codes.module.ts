import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCardCode } from './entities/gift-card-code.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { GiftCardCodesService } from './gift-card-codes.service';
import { GiftCardCodesController } from './gift-card-codes.controller';
import { OrdersModule } from '../../orders/orders.module';
import { LikeCardModule } from '../../integrations/likecard/likecard.module';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCardCode, ProductVariant]), forwardRef(() => OrdersModule), LikeCardModule],
  providers: [GiftCardCodesService],
  controllers: [GiftCardCodesController],
  exports: [GiftCardCodesService],
})
export class GiftCardCodesModule {}
