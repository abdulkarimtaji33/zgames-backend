import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Affiliate } from './entities/affiliate.entity';

@Injectable()
export class AffiliatesService {
  constructor(@InjectRepository(Affiliate) private readonly repo: Repository<Affiliate>) {}
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  async findOne(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Affiliate not found');
    return a;
  }
  async create(data: Partial<Affiliate>) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Affiliate>) { await this.findOne(id); await this.repo.update(id, data); return this.findOne(id); }
  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
