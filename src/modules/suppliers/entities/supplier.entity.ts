import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

@Entity('suppliers')
export class Supplier extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PurchaseOrder, (po) => po.supplier)
  purchaseOrders: PurchaseOrder[];
}
