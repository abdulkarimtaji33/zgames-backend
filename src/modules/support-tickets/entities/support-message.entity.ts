import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SupportTicket } from './support-ticket.entity';

export enum SenderType {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('support_messages')
export class SupportMessage extends AbstractEntity {
  @Column()
  ticketId: string;

  @Column()
  senderId: string;

  @Column({ type: 'enum', enum: SenderType })
  senderType: SenderType;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[] | null;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;
}
