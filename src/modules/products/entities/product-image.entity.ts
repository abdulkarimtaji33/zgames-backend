import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isFeatured: boolean;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
