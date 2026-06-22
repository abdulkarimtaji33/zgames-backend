import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('store_locations')
export class StoreLocation extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  lat: number | null;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  lng: number | null;

  @Column({ type: 'json', nullable: true })
  hours: Record<string, { open: string; close: string; closed?: boolean }> | null;

  @Column({ default: true })
  isActive: boolean;
}
