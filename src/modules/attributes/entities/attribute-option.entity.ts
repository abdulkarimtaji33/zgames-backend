import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Attribute } from './attribute.entity';

@Entity('attribute_options')
export class AttributeOption extends AbstractEntity {
  @Column()
  attributeId: string;

  @Column({ length: 255 })
  value: string;

  @Column({ length: 255 })
  label: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  colorCode: string | null;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;
}
