import { Entity, Column, Index } from 'typeorm';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  eventName: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  @Column({ type: 'json', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
