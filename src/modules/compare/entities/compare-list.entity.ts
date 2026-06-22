import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('compare_lists')
export class CompareList extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ type: 'json', default: '[]' })
  productIds: string[];
}
