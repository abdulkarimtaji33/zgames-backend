import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { FlashSale } from './entities/flash-sale.entity';
import { FlashSaleProduct } from './entities/flash-sale-product.entity';
import { CreateFlashSaleDto, UpdateFlashSaleDto } from './dto/flash-sale.dto';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectRepository(FlashSale) private readonly repo: Repository<FlashSale>,
    @InjectRepository(FlashSaleProduct) private readonly productRepo: Repository<FlashSaleProduct>,
  ) {}

  findAll() { return this.repo.find({ order: { startsAt: 'DESC' } }); }

  findActive() {
    const now = new Date();
    return this.repo.createQueryBuilder('fs')
      .leftJoinAndSelect('fs.products', 'fsp')
      .where('fs.isActive = true')
      .andWhere('fs.startsAt <= :now', { now })
      .andWhere('fs.endsAt >= :now', { now })
      .getMany();
  }

  async findOne(id: string) {
    const fs = await this.repo.findOne({ where: { id }, relations: { products: true } });
    if (!fs) throw new NotFoundException('Flash sale not found');
    return fs;
  }

  async create(dto: CreateFlashSaleDto) {
    const { products, ...rest } = dto;
    const sale = await this.repo.save(this.repo.create(rest));
    if (products?.length) {
      await this.productRepo.save(products.map((p) => this.productRepo.create({ ...p, flashSaleId: sale.id })));
    }
    return this.findOne(sale.id);
  }

  async update(id: string, dto: UpdateFlashSaleDto) {
    await this.findOne(id);
    const { products, ...rest } = dto;
    await this.repo.update(id, rest);
    if (products) {
      await this.productRepo.delete({ flashSaleId: id });
      await this.productRepo.save(products.map((p) => this.productRepo.create({ ...p, flashSaleId: id })));
    }
    return this.findOne(id);
  }

  async addProduct(flashSaleId: string, product: { productId: string; variantId?: string; salePrice: number; stockLimit?: number }) {
    await this.findOne(flashSaleId);
    return this.productRepo.save(this.productRepo.create({ ...product, flashSaleId }));
  }

  async removeProduct(flashSaleId: string, productId: string) {
    await this.productRepo.delete({ flashSaleId, productId });
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
