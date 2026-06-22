import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Order } from './order.entity';
import { ShipmentTracking } from './shipment-tracking.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

@Entity('shipments')
export class Shipment extends AbstractEntity {
  @Column()
  orderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  carrier: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trackingNumber: string | null;

  @Column({ nullable: true, type: 'text' })
  trackingUrl: string | null;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status: ShipmentStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  estimatedDeliveryAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  deliveredAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @OneToMany(() => ShipmentTracking, (t) => t.shipment, { cascade: true })
  trackingHistory: ShipmentTracking[];
}
