import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

export enum NotificationRecipientType {
  CUSTOMER = 'customer',
  USER = 'user',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity('notifications')
export class Notification extends AbstractEntity {
  @Column()
  @Index()
  recipientId: string;

  @Column({ type: 'enum', enum: NotificationRecipientType })
  recipientType: NotificationRecipientType;

  @Column({ length: 255 })
  type: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;
}
