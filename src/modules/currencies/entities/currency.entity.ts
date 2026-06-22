import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Country } from '../../countries/entities/country.entity';

@Entity('currencies')
export class Currency extends AbstractEntity {
  @Column({ unique: true, length: 3 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10 })
  symbol: string;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 1 })
  exchangeRate: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  countryId: string | null;

  @ManyToOne(() => Country, (country) => country.currencies, { nullable: true })
  @JoinColumn({ name: 'countryId' })
  country: Country | null;
}
