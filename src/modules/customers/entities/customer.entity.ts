import {
  Entity,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { CustomerAddress } from './customer-address.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

export enum CustomerGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('customers')
export class Customer extends AbstractEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ nullable: true, type: 'text' })
  avatar: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'enum', enum: CustomerGender, nullable: true })
  gender: CustomerGender | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  storeCredit: number;

  @Column({ type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  passwordResetExpires: Date | null;

  @OneToMany(() => CustomerAddress, (address) => address.customer, {
    cascade: true,
  })
  addresses: CustomerAddress[];

  @OneToMany(() => RefreshToken, (token) => token.customer)
  refreshTokens: RefreshToken[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
