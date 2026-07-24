import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVideo } from './entities/product-video.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductFaq } from './entities/product-faq.entity';
import { ProductDownload } from './entities/product-download.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  // Note: Inventory is registered here only for a read-only repository (stock aggregation
  // on product responses). Products does not import InventoryModule or its service/logic.
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, ProductImage, ProductVideo, ProductSpecification, ProductFaq, ProductDownload, Inventory])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
