import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends AbstractEntity {
  @Column()
  purchaseOrderId: string;

  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column({ length: 100 })
  sku: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ default: 0, type: 'int' })
  receivedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
