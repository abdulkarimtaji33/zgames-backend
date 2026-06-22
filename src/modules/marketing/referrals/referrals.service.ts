import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from './entities/referral.entity';

@Injectable()
export class ReferralsService {
  constructor(@InjectRepository(Referral) private readonly repo: Repository<Referral>) {}
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  findByReferrer(referrerId: string) { return this.repo.find({ where: { referrerId } }); }
  findByCode(code: string) { return this.repo.findOne({ where: { code } }); }
  async create(referrerId: string) {
    const code = `REF-${referrerId.slice(0, 8).toUpperCase()}`;
    const existing = await this.repo.findOne({ where: { referrerId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ referrerId, code, status: ReferralStatus.PENDING }));
  }
  async recordConversion(code: string, refereeId: string, orderId: string) {
    const ref = await this.repo.findOne({ where: { code } });
    if (!ref) throw new NotFoundException('Referral not found');
    await this.repo.update(ref.id, { refereeId, orderId, status: ReferralStatus.COMPLETED } as never);
    return this.repo.findOne({ where: { id: ref.id } });
  }
}
