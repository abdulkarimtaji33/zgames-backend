import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(@InjectRepository(Permission) private readonly repo: Repository<Permission>) {}

  findAll() { return this.repo.find({ order: { resource: 'ASC', action: 'ASC' } }); }
  findByResource(resource: string) { return this.repo.find({ where: { resource }, order: { action: 'ASC' } }); }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Permission not found');
    return p;
  }

  async create(dto: CreatePermissionDto) {
    const exists = await this.repo.findOne({ where: { resource: dto.resource, action: dto.action } });
    if (exists) throw new ConflictException('Permission already exists');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.delete(id); }

  async seedDefaults() {
    const defaults = [
      { resource: 'products', action: 'create' }, { resource: 'products', action: 'read' },
      { resource: 'products', action: 'update' }, { resource: 'products', action: 'delete' },
      { resource: 'orders', action: 'read' }, { resource: 'orders', action: 'update' },
      { resource: 'orders', action: 'refund' }, { resource: 'customers', action: 'read' },
      { resource: 'customers', action: 'update' }, { resource: 'inventory', action: 'manage' },
      { resource: 'marketing', action: 'manage' }, { resource: 'reports', action: 'view' },
      { resource: 'settings', action: 'manage' }, { resource: 'users', action: 'manage' },
      { resource: 'blog', action: 'manage' }, { resource: 'support', action: 'manage' },
    ];
    let created = 0;
    for (const d of defaults) {
      const exists = await this.repo.findOne({ where: { resource: d.resource, action: d.action } });
      if (!exists) { await this.repo.save(this.repo.create(d)); created++; }
    }
    return { created, total: defaults.length };
  }
}
