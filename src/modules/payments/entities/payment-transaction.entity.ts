import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Payment } from './payment.entity';

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
  CAPTURE = 'capture',
  VOID = 'void',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

@Entity('payment_transactions')
export class PaymentTransaction extends AbstractEntity {
  @Column()
  paymentId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayRef: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ nullable: true, type: 'text' })
  error: string | null;

  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;
}
