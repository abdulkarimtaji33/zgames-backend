import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { Shipment } from './shipment.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { OrderStatus, PaymentStatus } from './order.enums';

export { OrderStatus, PaymentStatus } from './order.enums';

@Entity('orders')
export class Order extends AbstractEntity {
  @Column({ unique: true, length: 50 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'json' })
  shippingAddress: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  billingAddress: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  couponDiscount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  giftCardCode: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  giftCardDiscount: number;

  @Column({ default: 0 })
  loyaltyPointsUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  loyaltyPointsDiscount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  storeCreditUsed: number;

  @Column({ length: 3, default: 'AED' })
  currency: string;

  @Column({ length: 2, default: 'AE' })
  countryCode: string;

  @Column({ nullable: true, type: 'text' })
  customerNotes: string | null;

  @Column({ nullable: true, type: 'text' })
  internalNotes: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  estimatedDelivery: Date | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotencyKey: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  @OneToMany(() => Shipment, (s) => s.order)
  shipments: Shipment[];

  @OneToMany(() => Payment, (p) => p.order)
  payments: Payment[];
}
