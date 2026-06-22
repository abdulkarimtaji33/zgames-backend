import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { CreateReviewDto, ReviewQueryDto } from './dto/review.dto';
import { ProductsService } from '../products/products.service';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(query: ReviewQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'customer')
      .leftJoinAndSelect('r.product', 'product')
      .skip(skip).take(take).orderBy('r.createdAt', 'DESC');
    if (query.status) qb.andWhere('r.status = :s', { s: query.status });
    if (query.productId) qb.andWhere('r.productId = :pid', { pid: query.productId });
    if (query.customerId) qb.andWhere('r.customerId = :cid', { cid: query.customerId });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const r = await this.repo.findOne({ where: { id }, relations: { customer: true, product: true } });
    if (!r) throw new NotFoundException('Review not found');
    return r;
  }

  async create(customerId: string, dto: CreateReviewDto) {
    const existing = await this.repo.findOne({ where: { customerId, productId: dto.productId } });
    if (existing) throw new ConflictException('You have already reviewed this product');
    return this.repo.save(this.repo.create({
      productId: dto.productId,
      customerId,
      rating: dto.rating,
      title: dto.title ?? null,
      body: dto.content ?? null,
      status: ReviewStatus.PENDING,
    }));
  }

  async approve(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: ReviewStatus.APPROVED } as never);
    await this.updateProductRating(id);
    return this.findOne(id);
  }

  async reject(id: string, reason?: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: ReviewStatus.REJECTED } as never);
    return this.findOne(id);
  }

  async addReply(id: string, replyText: string) {
    await this.findOne(id);
    await this.repo.update(id, { reply: replyText, repliedAt: new Date() } as never);
    return this.findOne(id);
  }

  private async updateProductRating(reviewId: string) {
    const review = await this.repo.findOne({ where: { id: reviewId } });
    if (!review) return;
    const { avg, count } = await this.repo.createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.productId = :pid AND r.status = :s', { pid: review.productId, s: ReviewStatus.APPROVED })
      .getRawOne() as { avg: number; count: number };
    await this.productsService.updateRating(review.productId, Math.round(Number(avg) * 10) / 10, Number(count));
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
