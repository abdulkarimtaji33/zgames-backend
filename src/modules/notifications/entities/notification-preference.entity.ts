import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { NotificationChannel } from './notification.entity';

@Entity('notification_preferences')
@Index('uq_notif_pref_customer_channel_type', ['customerId', 'channel', 'type'], { unique: true })
export class NotificationPreference extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ length: 255 })
  type: string;

  @Column({ default: true })
  isEnabled: boolean;
}
