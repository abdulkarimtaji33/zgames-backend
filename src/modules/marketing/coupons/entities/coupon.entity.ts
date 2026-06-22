import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { CouponUsage } from './coupon-usage.entity';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export enum CouponApplicableType {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
  BRAND = 'brand',
}

@Entity('coupons')
export class Coupon extends AbstractEntity {
  @Column({ unique: true, length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  minOrderAmount: number | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  maxDiscountAmount: number | null;

  @Column({ nullable: true, type: 'int' })
  usageLimit: number | null;

  @Column({ default: 0, type: 'int' })
  usedCount: number;

  @Column({ nullable: true, type: 'int' })
  perCustomerLimit: number | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  startsAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  endsAt: Date | null;

  @Column({
    type: 'enum',
    enum: CouponApplicableType,
    default: CouponApplicableType.ALL,
  })
  applicableType: CouponApplicableType;

  @Column({ type: 'json', nullable: true })
  applicableIds: string[] | null;

  @Column({ type: 'json', nullable: true })
  excludedIds: string[] | null;

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages: CouponUsage[];
}
