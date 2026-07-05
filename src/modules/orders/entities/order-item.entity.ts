import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem extends AbstractEntity {
  @Column()
  orderId: string;

  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column({ type: 'json' })
  productSnapshot: Record<string, unknown>;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  /** For gift_card-type products: the actual redemption codes delivered to the customer. */
  @Column({ type: 'json', nullable: true })
  deliveredCodes: string[] | null;

  /** Fulfillment state for digital code delivery. 'pending' means admin needs to manually assign a code. */
  @Column({ type: 'enum', enum: ['not_applicable', 'pending', 'fulfilled', 'partial'], default: 'not_applicable' })
  fulfillmentStatus: 'not_applicable' | 'pending' | 'fulfilled' | 'partial';

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
