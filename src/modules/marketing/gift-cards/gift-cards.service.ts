import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity';
import { GiftCardUsage } from './entities/gift-card-usage.entity';
import { CreateGiftCardDto, RedeemGiftCardDto } from './dto/gift-card.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GiftCardsService {
  constructor(
    @InjectRepository(GiftCard) private readonly repo: Repository<GiftCard>,
    @InjectRepository(GiftCardUsage) private readonly usageRepo: Repository<GiftCardUsage>,
  ) {}

  private generateCode(): string {
    const part = () => uuidv4().replace(/-/g, '').slice(0, 4).toUpperCase();
    return `${part()}-${part()}-${part()}-${part()}`;
  }

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  findMine(customerId: string) {
    return this.repo.find({ where: { purchasedByCustomerId: customerId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const gc = await this.repo.findOne({ where: { id }, relations: { usages: true } });
    if (!gc) throw new NotFoundException('Gift card not found');
    return gc;
  }

  async check(code: string) {
    const gc = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!gc) throw new NotFoundException('Gift card not found');
    return { code: gc.code, currentBalance: gc.currentBalance, isActive: gc.isActive, expiresAt: gc.expiresAt };
  }

  async create(amount: number, expiresAt?: Date, sentToEmail?: string, purchasedByCustomerId?: string) {
    const code = this.generateCode();
    return this.repo.save(this.repo.create({
      code,
      initialBalance: amount,
      currentBalance: amount,
      isActive: true,
      expiresAt: expiresAt ?? null,
      sentToEmail: sentToEmail ?? null,
      purchasedByCustomerId: purchasedByCustomerId ?? null,
    }));
  }

  async generateBatch(count: number, amount: number): Promise<GiftCard[]> {
    const results: GiftCard[] = [];
    for (let i = 0; i < count; i++) {
      const card = await this.repo.save(this.repo.create({
        code: this.generateCode(),
        initialBalance: amount,
        currentBalance: amount,
        isActive: true,
        expiresAt: null,
        purchasedByCustomerId: null,
        sentToEmail: null,
      }));
      results.push(card);
    }
    return results;
  }

  async redeem(dto: RedeemGiftCardDto) {
    const gc = await this.repo.findOne({ where: { code: dto.code.toUpperCase(), isActive: true } });
    if (!gc) throw new NotFoundException('Gift card not found or inactive');
    if (gc.expiresAt && new Date(gc.expiresAt) < new Date()) throw new BadRequestException('Gift card expired');
    if (Number(gc.currentBalance) < dto.amount) throw new BadRequestException('Insufficient gift card balance');

    const newBalance = Number(gc.currentBalance) - dto.amount;
    await this.repo.update(gc.id, { currentBalance: newBalance, isActive: newBalance > 0 });
    await this.usageRepo.save(this.usageRepo.create({ giftCardId: gc.id, customerId: dto.customerId, orderId: dto.orderId, amountUsed: dto.amount } as never));

    return { remainingBalance: newBalance };
  }
}
