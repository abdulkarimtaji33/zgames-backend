import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('settings')
export class Setting extends AbstractEntity {
  @Column({ unique: true, length: 255 })
  key: string;

  @Column({ type: 'json', nullable: true })
  value: unknown;

  @Column({ type: 'varchar', length: 100, nullable: true })
  group: string | null;

  @Column({ nullable: true, type: 'text' })
  description: string | null;
}
