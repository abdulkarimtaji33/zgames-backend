import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from './entities/return.entity';
import { ReturnItem } from './entities/return-item.entity';
import { CreateReturnDto, UpdateReturnDto, ReturnQueryDto } from './dto/return.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

export interface RequestingUser {
  id: string;
  roles?: Array<{ name: string } | string>;
}

function isStaff(user?: RequestingUser): boolean {
  return Array.isArray(user?.roles) && user.roles.length > 0;
}

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
    if (query.search) {
      qb.leftJoin('orders', 'o', 'o.id = r.orderId')
        .andWhere('(r.reason LIKE :q OR o.orderNumber LIKE :q)', { q: `%${query.search}%` });
    }
    if (query.dateFrom) qb.andWhere('r.createdAt >= :from', { from: new Date(query.dateFrom) });
    if (query.dateTo) qb.andWhere('r.createdAt <= :to', { to: new Date(query.dateTo) });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  /** `requester` is omitted for internal/staff-guarded call sites; pass it for any customer-reachable route so ownership is enforced. */
  async findOne(id: string, requester?: RequestingUser) {
    const r = await this.repo.findOne({ where: { id }, relations: { items: true } });
    if (!r) throw new NotFoundException('Return not found');
    if (requester && !isStaff(requester) && r.customerId !== requester.id) {
      // 404 rather than 403 — don't confirm to a non-owner that this id exists at all.
      throw new NotFoundException('Return not found');
    }
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
