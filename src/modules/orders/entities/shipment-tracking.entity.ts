import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Shipment } from './shipment.entity';

@Entity('shipment_tracking')
export class ShipmentTracking extends AbstractEntity {
  @Column()
  shipmentId: string;

  @Column({ length: 255 })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column()
  timestamp: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.trackingHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;
}
