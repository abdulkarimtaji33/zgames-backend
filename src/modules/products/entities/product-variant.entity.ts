import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  salePrice: number | null;

  @Column({ type: 'json' })
  options: Array<{ attributeId: string; optionId: string }>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  /** Optional API supplier config for auto-restocking digital gift card codes when local pool runs low. */
  @Column({ type: 'json', nullable: true })
  giftCardSupplierConfig: {
    enabled: boolean;
    apiUrl: string;
    apiKey?: string;
    method?: 'GET' | 'POST';
    bodyTemplate?: string;
    codePath?: string;
  } | null;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
