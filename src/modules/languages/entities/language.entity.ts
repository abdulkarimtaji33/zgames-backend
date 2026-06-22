import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('languages')
export class Language extends AbstractEntity {
  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  nativeName: string;

  @Column({ default: false })
  isRTL: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;
}
