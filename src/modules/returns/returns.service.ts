import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from './entities/return.entity';
import { ReturnItem } from './entities/return-item.entity';
import { CreateReturnDto, UpdateReturnDto, ReturnQueryDto } from './dto/return.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return) private readonly repo: Repository<Return>,
    @InjectRepository(ReturnItem) private readonly itemRepo: Repository<ReturnItem>,
  ) {}

  async findAll(query: ReturnQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('r').skip(skip).take(take).orderBy('r.createdAt', 'DESC');
    if (query.status) qb.andWhere('r.status = :s', { s: query.status });
    if (query.customerId) qb.andWhere('r.customerId = :cid', { cid: query.customerId });
    if (query.orderId) qb.andWhere('r.orderId = :oid', { oid: query.orderId });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const r = await this.repo.findOne({ where: { id }, relations: { items: true } });
    if (!r) throw new NotFoundException('Return not found');
    return r;
  }

  async create(customerId: string, dto: CreateReturnDto) {
    const reason = dto.items.map((i) => i.reason).join(', ');
    const ret = await this.repo.save(
      this.repo.create({
        orderId: dto.orderId,
        customerId,
        reason,
        notes: dto.customerNotes ?? null,
      }),
    );
    const items = dto.items.map((item) => this.itemRepo.create({ returnId: ret.id, orderItemId: item.orderItemId, quantity: item.quantity, reason: item.reason }));
    await this.itemRepo.save(items);
    return this.findOne(ret.id);
  }

  async update(id: string, dto: UpdateReturnDto) {
    await this.findOne(id);
    await this.repo.update(id, { status: dto.status as never, notes: dto.adminNotes ?? undefined } as never);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
