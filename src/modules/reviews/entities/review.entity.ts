import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('reviews')
export class Review extends AbstractEntity {
  @Column()
  productId: string;

  @Column()
  customerId: string;

  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ nullable: true, type: 'text' })
  body: string | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ default: 0 })
  helpfulCount: number;

  @Column({ type: 'json', nullable: true })
  images: string[] | null;

  @Column({ nullable: true, type: 'text' })
  reply: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  repliedAt: Date | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
