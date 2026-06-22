import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly repo: Repository<Role>,
    @InjectRepository(Permission) private readonly permRepo: Repository<Permission>,
  ) {}

  findAll() { return this.repo.find({ relations: { permissions: true }, order: { name: 'ASC' } }); }

  async findOne(id: string) {
    const r = await this.repo.findOne({ where: { id }, relations: { permissions: true } });
    if (!r) throw new NotFoundException('Role not found');
    return r;
  }

  async findByName(name: string) {
    return this.repo.findOne({ where: { name }, relations: { permissions: true } });
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Role name already exists');
    const { permissionIds, ...rest } = dto;
    const role = this.repo.create(rest);
    if (permissionIds?.length) {
      role.permissions = await this.permRepo.findBy({ id: In(permissionIds) });
    }
    return this.repo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (role.isSystem && dto.name) throw new BadRequestException('Cannot rename system role');
    const { permissionIds, ...rest } = dto;
    Object.assign(role, rest);
    if (permissionIds !== undefined) {
      role.permissions = permissionIds.length ? await this.permRepo.findBy({ id: In(permissionIds) }) : [];
    }
    return this.repo.save(role);
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    const role = await this.findOne(id);
    role.permissions = await this.permRepo.findBy({ id: In(dto.permissionIds) });
    return this.repo.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('Cannot delete system role');
    await this.repo.softDelete(id);
  }

  async seedDefaults() {
    const defaults = [
      { name: 'super_admin', description: 'Full access to everything', isSystem: true },
      { name: 'admin', description: 'General admin access', isSystem: true },
      { name: 'marketing_manager', description: 'Marketing and promotions', isSystem: true },
      { name: 'warehouse_manager', description: 'Inventory and shipping', isSystem: true },
      { name: 'finance_manager', description: 'Orders and payments', isSystem: true },
      { name: 'customer_support', description: 'Customer service', isSystem: true },
      { name: 'content_editor', description: 'Blog and CMS', isSystem: true },
    ];
    let created = 0;
    for (const d of defaults) {
      const exists = await this.repo.findOne({ where: { name: d.name } });
      if (!exists) { await this.repo.save(this.repo.create(d)); created++; }
    }
    return { created, total: defaults.length };
  }
}
