import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto, CouponQueryDto } from './dto/coupon.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../../common/utils/pagination.util';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
    @InjectRepository(CouponUsage) private readonly usageRepo: Repository<CouponUsage>,
  ) {}

  async findAll(query: CouponQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('c').skip(skip).take(take).orderBy('c.createdAt', 'DESC');
    if (query.isActive !== undefined) qb.andWhere('c.isActive = :a', { a: query.isActive });
    if (query.search) qb.andWhere('c.code LIKE :s', { s: `%${query.search}%` });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
    return c;
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase();
    const exists = await this.repo.findOne({ where: { code } });
    if (exists) throw new ConflictException('Coupon code already exists');
    return this.repo.save(this.repo.create({ ...dto, code } as never));
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);
    if (dto.code) dto.code = dto.code.toUpperCase();
    await this.repo.update(id, dto as never);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }

  async validate(dto: ValidateCouponDto): Promise<{ valid: boolean; discount: number; coupon?: Coupon; message?: string }> {
    const code = dto.code.toUpperCase();
    const coupon = await this.repo.findOne({ where: { code, isActive: true } });
    if (!coupon) return { valid: false, discount: 0, message: 'Invalid coupon code' };

    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) return { valid: false, discount: 0, message: 'Coupon not yet active' };
    if (coupon.endsAt && new Date(coupon.endsAt) < now) return { valid: false, discount: 0, message: 'Coupon expired' };
    if (coupon.usageLimit) {
      const used = await this.usageRepo.count({ where: { couponId: coupon.id } });
      if (used >= coupon.usageLimit) return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
    }
    if (dto.customerId && coupon.perCustomerLimit) {
      const used = await this.usageRepo.count({ where: { couponId: coupon.id, customerId: dto.customerId } });
      if (used >= coupon.perCustomerLimit) return { valid: false, discount: 0, message: 'You have already used this coupon' };
    }
    if (coupon.minOrderAmount && dto.orderAmount && dto.orderAmount < Number(coupon.minOrderAmount)) {
      return { valid: false, discount: 0, message: `Minimum order amount is ${coupon.minOrderAmount}` };
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (dto.orderAmount ?? 0) * (Number(coupon.value) / 100);
      if (coupon.maxDiscountAmount) discount = Math.min(discount, Number(coupon.maxDiscountAmount));
    } else if (coupon.type === CouponType.FIXED_AMOUNT) {
      discount = Math.min(Number(coupon.value), dto.orderAmount ?? 0);
    } else if (coupon.type === CouponType.FREE_SHIPPING) {
      discount = 0;
    }

    return { valid: true, discount: Math.round(discount * 100) / 100, coupon };
  }

  async recordUsage(couponId: string, customerId: string, orderId: string, discountAmount: number) {
    const coupon = await this.repo.findOne({ where: { id: couponId } });
    if (coupon) {
      await this.repo.update(couponId, { usedCount: (coupon.usedCount ?? 0) + 1 } as never);
      await this.usageRepo.save(this.usageRepo.create({ couponId, customerId, orderId, discountAmount } as never));
    }
  }
}
