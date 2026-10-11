import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('cities')
@Index(['countryCode'])
export class City extends AbstractEntity {
  @Column({ length: 2 })
  countryCode: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  stateName: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
