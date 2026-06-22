import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

export enum InventoryTransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  DAMAGE = 'damage',
}

@Entity('inventory_transactions')
export class InventoryTransaction extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column()
  warehouseId: string;

  @Column({ type: 'enum', enum: InventoryTransactionType })
  type: InventoryTransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  quantityBefore: number;

  @Column({ type: 'int' })
  quantityAfter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceType: string | null;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;
}
