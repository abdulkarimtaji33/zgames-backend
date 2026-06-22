import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreLocation } from './entities/store-location.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(StoreLocation) private readonly repo: Repository<StoreLocation>) {}
  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }
  findActive() { return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } }); }
  async findOne(id: string) { const s = await this.repo.findOne({ where: { id } }); if (!s) throw new NotFoundException('Store not found'); return s; }
  create(dto: CreateStoreDto) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: UpdateStoreDto) { await this.findOne(id); await this.repo.update(id, dto); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
