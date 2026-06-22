import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpsertSettingDto, BulkUpsertSettingsDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private readonly repo: Repository<Setting>) {}

  findAll() { return this.repo.find({ order: { group: 'ASC', key: 'ASC' } }); }
  findByGroup(group: string) { return this.repo.find({ where: { group }, order: { key: 'ASC' } }); }

  async get(key: string): Promise<unknown | null> {
    const s = await this.repo.findOne({ where: { key } });
    return s?.value ?? null;
  }

  async getTyped<T = unknown>(key: string): Promise<T | null> {
    const s = await this.repo.findOne({ where: { key } });
    if (!s) return null;
    return s.value as T;
  }

  async upsert(dto: UpsertSettingDto) {
    const existing = await this.repo.findOne({ where: { key: dto.key } });
    if (existing) {
      await this.repo.update(existing.id, { value: dto.value, group: dto.group ?? null, description: dto.description ?? null } as never);
      return this.repo.findOne({ where: { key: dto.key } });
    }
    return this.repo.save(this.repo.create({ key: dto.key, value: dto.value, group: dto.group ?? null, description: dto.description ?? null } as never));
  }

  async bulkUpsert(dto: BulkUpsertSettingsDto) {
    return Promise.all(dto.settings.map((s) => this.upsert(s)));
  }

  async remove(key: string) {
    const s = await this.repo.findOne({ where: { key } });
    if (!s) throw new NotFoundException('Setting not found');
    await this.repo.delete(s.id);
  }
}
