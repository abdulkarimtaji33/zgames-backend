import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Order } from './order.entity';
import { OrderStatus } from './order.enums';

@Entity('order_status_history')
export class OrderStatusHistory extends AbstractEntity {
  @Column()
  orderId: string;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @Column({ default: true })
  isCustomerVisible: boolean;

  @ManyToOne(() => Order, (order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
