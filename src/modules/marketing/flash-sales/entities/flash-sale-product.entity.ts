import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { FlashSale } from './flash-sale.entity';

@Entity('flash_sale_products')
export class FlashSaleProduct extends AbstractEntity {
  @Column()
  flashSaleId: string;

  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salePrice: number;

  @Column({ nullable: true, type: 'int' })
  stockLimit: number | null;

  @Column({ default: 0, type: 'int' })
  soldCount: number;

  @ManyToOne(() => FlashSale, (sale) => sale.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashSaleId' })
  flashSale: FlashSale;
}
