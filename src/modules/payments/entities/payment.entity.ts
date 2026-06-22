import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentTransaction } from './payment-transaction.entity';

export enum PaymentMethod {
  STRIPE = 'stripe',
  TABBY = 'tabby',
  TAMARA = 'tamara',
  PAYPAL = 'paypal',
  COD = 'cod',
}

export enum PaymentEntityStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment extends AbstractEntity {
  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentEntityStatus,
    default: PaymentEntityStatus.PENDING,
  })
  status: PaymentEntityStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'AED' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayPaymentId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayOrderId: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToMany(() => PaymentTransaction, (t) => t.payment, { cascade: true })
  transactions: PaymentTransaction[];
}
