import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { GiftCard } from './gift-card.entity';

@Entity('gift_card_usages')
export class GiftCardUsage extends AbstractEntity {
  @Column()
  giftCardId: string;

  @Column()
  customerId: string;

  @Column()
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @ManyToOne(() => GiftCard, (card) => card.usages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'giftCardId' })
  giftCard: GiftCard;
}
