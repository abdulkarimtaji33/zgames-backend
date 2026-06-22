import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  CONFIRMED = 'confirmed',
  RECEIVING = 'receiving',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder extends AbstractEntity {
  @Column({ unique: true, length: 50 })
  orderNumber: string;

  @Column()
  supplierId: string;

  @Column()
  warehouseId: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  expectedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  receivedAt: Date | null;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
  })
  items: PurchaseOrderItem[];
}
