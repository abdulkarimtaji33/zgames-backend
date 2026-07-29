import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../../common/entities/abstract.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';

export enum GiftCardCodeStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  DISABLED = 'disabled',
}

export enum GiftCardCodeSource {
  MANUAL = 'manual',
  API = 'api',
}

/** A single redemption code for a third-party digital gift card (e.g. one PSN $50 code). */
@Entity('gift_card_codes')
export class GiftCardCode extends AbstractEntity {
  @Column()
  @Index()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  variantId: string | null;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'enum', enum: GiftCardCodeStatus, default: GiftCardCodeStatus.AVAILABLE })
  @Index()
  status: GiftCardCodeStatus;

  @Column({ type: 'enum', enum: GiftCardCodeSource, default: GiftCardCodeSource.MANUAL })
  source: GiftCardCodeSource;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderItemId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string | null;

  @Column({ type: 'datetime', nullable: true })
  soldAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** LikeCard's own order id, set only when this code was fulfilled via a live LikeCard create_order call. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  likecardOrderId: string | null;

  /** Our own idempotency referenceId sent to LikeCard's create_order — kept for reconciliation/support lookups. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  likecardReferenceId: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;
}
