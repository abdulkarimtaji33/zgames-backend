import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto, UpdateCurrencyDto, CurrencyQueryDto } from './dto/currency.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class CurrenciesService {
  constructor(@InjectRepository(Currency) private readonly repo: Repository<Currency>) {}

  async findAll(query: CurrencyQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('c').skip(skip).take(take).orderBy('c.code', 'ASC');
    if (query.isActive !== undefined) qb.andWhere('c.isActive = :a', { a: query.isActive });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 50);
  }

  findActive() { return this.repo.find({ where: { isActive: true }, order: { code: 'ASC' } }); }

  async getDefault() {
    const c = await this.repo.findOne({ where: { isDefault: true } });
    if (!c) throw new NotFoundException('No default currency set');
    return c;
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Currency not found');
    return item;
  }

  async findByCode(code: string) {
    const item = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!item) throw new NotFoundException('Currency not found');
    return item;
  }

  async create(dto: CreateCurrencyDto) {
    const exists = await this.repo.findOne({ where: { code: dto.code.toUpperCase() } });
    if (exists) throw new ConflictException('Currency code already exists');
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    const entity = this.repo.create({ ...dto, code: dto.code.toUpperCase() });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    await this.findOne(id);
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    if (dto.code) dto.code = dto.code.toUpperCase();
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, { isDefault: true });
    return this.findOne(id);
  }

  async updateRates(rates: Record<string, number>) {
    for (const [code, rate] of Object.entries(rates)) {
      await this.repo.update({ code }, { exchangeRate: rate });
    }
    return { updated: Object.keys(rates).length };
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }

  async convert(amount: number, fromCode: string, toCode: string): Promise<number> {
    if (fromCode === toCode) return amount;
    const from = await this.findByCode(fromCode);
    const to = await this.findByCode(toCode);
    return (amount / Number(from.exchangeRate)) * Number(to.exchangeRate);
  }
}
