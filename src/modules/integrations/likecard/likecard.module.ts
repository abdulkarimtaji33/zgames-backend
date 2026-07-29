import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { LikeCardApiService } from './likecard-api.service';
import { LikeCardService } from './likecard.service';
import { LikeCardController } from './likecard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  providers: [LikeCardApiService, LikeCardService],
  controllers: [LikeCardController],
  exports: [LikeCardApiService, LikeCardService],
})
export class LikeCardModule {}
