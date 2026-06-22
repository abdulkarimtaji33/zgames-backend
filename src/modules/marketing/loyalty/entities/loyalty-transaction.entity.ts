import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { Customer } from '../../../customers/entities/customer.entity';

export enum LoyaltyTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  ADJUST = 'adjust',
  REFUND = 'refund',
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ type: 'enum', enum: LoyaltyTransactionType })
  type: LoyaltyTransactionType;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  balance: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
