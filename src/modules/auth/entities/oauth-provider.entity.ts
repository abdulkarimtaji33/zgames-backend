import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum OAuthProviderType {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

export enum OAuthOwnerType {
  USER = 'user',
  CUSTOMER = 'customer',
}

@Entity('oauth_providers')
export class OAuthProvider extends AbstractEntity {
  @Column({ type: 'enum', enum: OAuthProviderType })
  provider: OAuthProviderType;

  @Column({ length: 255 })
  @Index()
  providerUserId: string;

  @Column({ type: 'enum', enum: OAuthOwnerType })
  ownerType: OAuthOwnerType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  customerId: string | null;

  @Column({ nullable: true, type: 'text' })
  accessToken: string | null;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;
}
