import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Role } from '../../roles/entities/role.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User extends AbstractEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
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

  @Column({ type: 'varchar', length: 36, nullable: true })
  lastLoginAt: Date | null;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
