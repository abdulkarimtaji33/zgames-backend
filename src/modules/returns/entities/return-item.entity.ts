import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Return } from './return.entity';

@Entity('return_items')
export class ReturnItem extends AbstractEntity {
  @Column()
  returnId: string;

  @Column()
  orderItemId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  condition: string | null;

  @Column({ nullable: true, type: 'text' })
  reason: string | null;

  @ManyToOne(() => Return, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'returnId' })
  returnRequest: Return;
}
