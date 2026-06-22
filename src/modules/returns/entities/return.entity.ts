import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { ReturnItem } from './return-item.entity';

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  REJECTED = 'rejected',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'original_payment',
  STORE_CREDIT = 'store_credit',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('returns')
export class Return extends AbstractEntity {
  @Column()
  orderId: string;

  @Column()
  customerId: string;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number | null;

  @Column({ type: 'enum', enum: RefundMethod, nullable: true })
  refundMethod: RefundMethod | null;

  @OneToMany(() => ReturnItem, (item) => item.returnRequest, { cascade: true })
  items: ReturnItem[];
}
