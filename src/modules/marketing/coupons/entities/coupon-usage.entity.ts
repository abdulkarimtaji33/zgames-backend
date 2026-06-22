import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { Coupon } from './coupon.entity';

@Entity('coupon_usages')
export class CouponUsage extends AbstractEntity {
  @Column()
  couponId: string;

  @Column()
  customerId: string;

  @Column()
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountAmount: number;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;
}
