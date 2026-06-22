import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';

export enum AffiliateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('affiliates')
export class Affiliate extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingEarnings: number;

  @Column({ type: 'enum', enum: AffiliateStatus, default: AffiliateStatus.PENDING })
  status: AffiliateStatus;
}
