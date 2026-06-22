import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { AdjustLoyaltyDto, RedeemPointsDto, LoyaltyTransactionType } from './dto/loyalty.dto';

const POINTS_PER_CURRENCY = 10;
const POINTS_VALUE = 0.01;

export enum LoyaltyTier { BRONZE = 'Bronze', SILVER = 'Silver', GOLD = 'Gold', PLATINUM = 'Platinum' }

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransaction) private readonly txRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  getTier(points: number): LoyaltyTier {
    if (points >= 10000) return LoyaltyTier.PLATINUM;
    if (points >= 5000) return LoyaltyTier.GOLD;
    if (points >= 1000) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  getPointsValue(points: number): number { return points * POINTS_VALUE; }

  async getHistory(customerId: string) {
    return this.txRepo.find({ where: { customerId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async adjust(dto: AdjustLoyaltyDto) {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.type === LoyaltyTransactionType.REDEEMED || (dto.type === LoyaltyTransactionType.ADJUSTED && dto.points < 0)) {
      const deduction = Math.abs(dto.points);
      if (customer.loyaltyPoints < deduction) throw new BadRequestException('Insufficient loyalty points');
      customer.loyaltyPoints -= deduction;
    } else {
      customer.loyaltyPoints += Math.abs(dto.points);
    }

    await this.customerRepo.save(customer);
    return this.txRepo.save(this.txRepo.create({ customerId: dto.customerId, type: dto.type, points: dto.points, orderId: dto.reference ?? null, description: dto.notes ?? null, balance: customer.loyaltyPoints } as never));
  }

  async earnFromOrder(customerId: string, orderId: string, orderAmount: number) {
    const points = Math.floor(orderAmount * POINTS_PER_CURRENCY);
    return this.adjust({ customerId, points, type: LoyaltyTransactionType.EARNED, reference: orderId, notes: `Earned from order` });
  }

  async redeem(dto: RedeemPointsDto) {
    const value = this.getPointsValue(dto.points);
    return this.adjust({ customerId: dto.customerId, points: -dto.points, type: LoyaltyTransactionType.REDEEMED, reference: dto.orderId, notes: `Redeemed for AED ${value}` });
  }
}

