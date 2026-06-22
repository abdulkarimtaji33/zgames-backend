import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto, UpdateBrandDto, BrandQueryDto } from './dto/brand.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import slugify from 'slugify';

@Injectable()
export class BrandsService {
  constructor(@InjectRepository(Brand) private readonly repo: Repository<Brand>) {}

  async findAll(query: BrandQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('b').skip(skip).take(take).orderBy('b.sortOrder', 'ASC').addOrderBy('b.name', 'ASC');
    if (query.search) qb.andWhere('b.name LIKE :s', { s: `%${query.search}%` });
    if (query.isActive !== undefined) qb.andWhere('b.isActive = :a', { a: query.isActive });
    if (query.isFeatured !== undefined) qb.andWhere('b.isFeatured = :f', { f: query.isFeatured });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  findFeatured() { return this.repo.find({ where: { isFeatured: true, isActive: true }, order: { sortOrder: 'ASC' } }); }

  async findOne(id: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }

  async findBySlug(slug: string) {
    const b = await this.repo.findOne({ where: { slug } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }

  async create(dto: CreateBrandDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new ConflictException('Brand name already exists');
    return this.repo.save(this.repo.create({ ...dto, slug }));
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    const updates: Partial<Brand> = { ...dto } as Partial<Brand>;
    if (dto.name) updates.slug = slugify(dto.name, { lower: true, strict: true });
    await this.repo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
