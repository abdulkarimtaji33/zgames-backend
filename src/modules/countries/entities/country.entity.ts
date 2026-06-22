import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Currency } from '../../currencies/entities/currency.entity';

@Entity('countries')
export class Country extends AbstractEntity {
  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 2 })
  code: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  dialCode: string | null;

  @Column({ length: 3 })
  currencyCode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  taxRate: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  flagIcon: string | null;

  @OneToMany(() => Currency, (c) => c.country)
  currencies: Currency[];
}
