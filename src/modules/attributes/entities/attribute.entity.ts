import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { AttributeOption } from './attribute-option.entity';

export enum AttributeType {
  TEXT = 'text',
  SELECT = 'select',
  COLOR = 'color',
  SIZE = 'size',
  BOOLEAN = 'boolean',
}

@Entity('attributes')
export class Attribute extends AbstractEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: 'enum', enum: AttributeType, default: AttributeType.SELECT })
  type: AttributeType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AttributeOption, (option) => option.attribute, {
    cascade: true,
  })
  options: AttributeOption[];
}
