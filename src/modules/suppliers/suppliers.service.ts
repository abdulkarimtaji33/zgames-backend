import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from './dto/supplier.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class SuppliersService {
  constructor(@InjectRepository(Supplier) private readonly repo: Repository<Supplier>) {}

  async findAll(query: SupplierQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('s').skip(skip).take(take).orderBy('s.name', 'ASC');
    if (query.search) qb.andWhere('s.name LIKE :q OR s.email LIKE :q', { q: `%${query.search}%` });
    if (query.isActive !== undefined) qb.andWhere('s.isActive = :a', { a: query.isActive });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async create(dto: CreateSupplierDto) { return this.repo.save(this.repo.create(dto)); }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
