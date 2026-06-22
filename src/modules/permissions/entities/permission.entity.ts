import { Entity, Column, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('permissions')
export class Permission extends AbstractEntity {
  @Column({ length: 100 })
  resource: string;

  @Column({ length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  description: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
