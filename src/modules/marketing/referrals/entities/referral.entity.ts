import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REWARDED = 'rewarded',
  EXPIRED = 'expired',
}

@Entity('referrals')
export class Referral extends AbstractEntity {
  @Column()
  referrerId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  refereeId: string | null;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rewardAmount: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string | null;
}
