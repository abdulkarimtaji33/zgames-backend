import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Customer } from './customer.entity';

@Entity('customer_addresses')
export class CustomerAddress extends AbstractEntity {
  @Column()
  customerId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company: string | null;

  @Column({ type: 'text' })
  addressLine1: string;

  @Column({ nullable: true, type: 'text' })
  addressLine2: string | null;

  @Column({ length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ length: 10 })
  countryCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  label: string | null;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
