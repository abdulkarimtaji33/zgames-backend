import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SupportMessage } from './support-message.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('support_tickets')
export class SupportTicket extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ length: 500 })
  subject: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({ type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  assignedTo: string | null;

  @OneToMany(() => SupportMessage, (msg) => msg.ticket, { cascade: true })
  messages: SupportMessage[];
}
