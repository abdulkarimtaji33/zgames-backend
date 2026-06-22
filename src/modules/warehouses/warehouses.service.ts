import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(@InjectRepository(Warehouse) private readonly repo: Repository<Warehouse>) {}

  findAll() { return this.repo.find({ order: { isDefault: 'DESC', name: 'ASC' } }); }

  async findOne(id: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('Warehouse not found');
    return w;
  }

  async findDefault() {
    return this.repo.findOne({ where: { isDefault: true, isActive: true } });
  }

  async create(dto: CreateWarehouseDto) {
    const exists = await this.repo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Warehouse code already exists');
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, { isDefault: true });
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
