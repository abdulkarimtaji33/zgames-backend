import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  description: string | null;

  @Column({ default: false })
  isSystem: boolean;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
