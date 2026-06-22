import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { GiftCardUsage } from './gift-card-usage.entity';

@Entity('gift_cards')
export class GiftCard extends AbstractEntity {
  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  initialBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentBalance: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  purchasedByCustomerId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sentToEmail: string | null;

  @OneToMany(() => GiftCardUsage, (u) => u.giftCard)
  usages: GiftCardUsage[];
}
