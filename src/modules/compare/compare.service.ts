import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompareList } from './entities/compare-list.entity';

const MAX_COMPARE = 4;

@Injectable()
export class CompareService {
  constructor(@InjectRepository(CompareList) private readonly repo: Repository<CompareList>) {}

  async getOrCreate(customerId: string) {
    let list = await this.repo.findOne({ where: { customerId } });
    if (!list) list = await this.repo.save(this.repo.create({ customerId, productIds: [] }));
    return list;
  }

  async addProduct(customerId: string, productId: string) {
    const list = await this.getOrCreate(customerId);
    const ids: string[] = Array.isArray(list.productIds) ? list.productIds : JSON.parse(list.productIds as never ?? '[]');
    if (ids.includes(productId)) return list;
    if (ids.length >= MAX_COMPARE) throw new BadRequestException(`You can compare up to ${MAX_COMPARE} products`);
    ids.push(productId);
    await this.repo.update(list.id, { productIds: ids as never });
    return this.getOrCreate(customerId);
  }

  async removeProduct(customerId: string, productId: string) {
    const list = await this.getOrCreate(customerId);
    const ids: string[] = Array.isArray(list.productIds) ? list.productIds : JSON.parse(list.productIds as never ?? '[]');
    await this.repo.update(list.id, { productIds: ids.filter((id) => id !== productId) as never });
    return this.getOrCreate(customerId);
  }

  async clearList(customerId: string) {
    const list = await this.getOrCreate(customerId);
    await this.repo.update(list.id, { productIds: [] as never });
    return this.getOrCreate(customerId);
  }
}
