import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum TokenOwnerType {
  USER = 'user',
  CUSTOMER = 'customer',
}

@Entity('refresh_tokens')
export class RefreshToken extends AbstractEntity {
  @Column({ type: 'text' })
  @Index()
  token: string;

  @Column({ type: 'enum', enum: TokenOwnerType })
  ownerType: TokenOwnerType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string | null;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne(() => Customer, (customer) => customer.refreshTokens, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;
}
