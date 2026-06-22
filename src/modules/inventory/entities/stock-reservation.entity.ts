import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

export enum ReservationStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
  FULFILLED = 'fulfilled',
}

@Entity('stock_reservations')
export class StockReservation extends AbstractEntity {
  @Column()
  productId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  variantId: string | null;

  @Column()
  warehouseId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  orderId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column()
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;
}
