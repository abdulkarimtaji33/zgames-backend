import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Entity('inventory')
@Index('uq_inventory_product_variant_warehouse', ['productId', 'variantId', 'warehouseId'], { unique: true })
export class Inventory extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column()
  warehouseId: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  lowStockThreshold: number | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }
}
