import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto, UpdateCountryDto, CountryQueryDto } from './dto/country.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class CountriesService {
  constructor(@InjectRepository(Country) private readonly repo: Repository<Country>) {}

  async findAll(query: CountryQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('c').skip(skip).take(take).orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC');
    if (query.isActive !== undefined) qb.andWhere('c.isActive = :a', { a: query.isActive });
    if (query.search) qb.andWhere('c.name LIKE :s OR c.code LIKE :s', { s: `%${query.search}%` });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 50);
  }

  findActive() { return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', name: 'ASC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Country not found');
    return item;
  }

  async findByCode(code: string) {
    const item = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!item) throw new NotFoundException('Country not found');
    return item;
  }

  async create(dto: CreateCountryDto) {
    const exists = await this.repo.findOne({ where: { code: dto.code.toUpperCase() } });
    if (exists) throw new ConflictException('Country code already exists');
    const entity = this.repo.create({ ...dto, code: dto.code.toUpperCase() });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOne(id);
    if (dto.code) dto.code = dto.code.toUpperCase();
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
  async setActive(id: string, isActive: boolean) { await this.repo.update(id, { isActive }); return this.findOne(id); }
}
