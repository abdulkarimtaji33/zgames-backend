import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('warehouses')
export class Warehouse extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ nullable: true, type: 'text' })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Inventory, (inv) => inv.warehouse)
  inventory: Inventory[];
}
