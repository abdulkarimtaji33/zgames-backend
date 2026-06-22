import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist) private readonly repo: Repository<Wishlist>,
    @InjectRepository(WishlistItem) private readonly itemRepo: Repository<WishlistItem>,
  ) {}

  async getOrCreate(customerId: string) {
    let wishlist = await this.repo.findOne({ where: { customerId }, relations: { items: true } });
    if (!wishlist) wishlist = await this.repo.save(this.repo.create({ customerId }));
    return wishlist;
  }

  async addProduct(customerId: string, productId: string) {
    const wishlist = await this.getOrCreate(customerId);
    const exists = await this.itemRepo.findOne({ where: { wishlistId: wishlist.id, productId } });
    if (exists) return wishlist;
    await this.itemRepo.save(this.itemRepo.create({ wishlistId: wishlist.id, productId }));
    return this.getOrCreate(customerId);
  }

  async removeProduct(customerId: string, productId: string) {
    const wishlist = await this.getOrCreate(customerId);
    await this.itemRepo.delete({ wishlistId: wishlist.id, productId });
    return this.getOrCreate(customerId);
  }

  async clearWishlist(customerId: string) {
    const wishlist = await this.getOrCreate(customerId);
    await this.itemRepo.delete({ wishlistId: wishlist.id });
    return this.getOrCreate(customerId);
  }

  async isInWishlist(customerId: string, productId: string): Promise<boolean> {
    const wishlist = await this.repo.findOne({ where: { customerId } });
    if (!wishlist) return false;
    const item = await this.itemRepo.findOne({ where: { wishlistId: wishlist.id, productId } });
    return !!item;
  }
}
