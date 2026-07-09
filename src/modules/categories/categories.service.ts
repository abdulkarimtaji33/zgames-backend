import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repo: TreeRepository<Category>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async getProductCounts(): Promise<Record<string, number>> {
    const rows = await this.productRepo.createQueryBuilder('p')
      .select('p.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('p.categoryId IS NOT NULL')
      .groupBy('p.categoryId')
      .getRawMany<{ categoryId: string; count: string }>();
    return Object.fromEntries(rows.map((r) => [r.categoryId, Number(r.count)]));
  }

  async findAll(query: CategoryQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.parent', 'parent')
      .skip(skip).take(take)
      .orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC');
    if (query.search) qb.andWhere('c.name LIKE :s', { s: `%${query.search}%` });
    if (query.isActive !== undefined) qb.andWhere('c.isActive = :a', { a: query.isActive });
    if (query.isFeatured !== undefined) qb.andWhere('c.isFeatured = :f', { f: query.isFeatured });
    if (query.parentId) qb.andWhere('parent.id = :pid', { pid: query.parentId });
    else if (query.parentId === null) qb.andWhere('c.parent IS NULL');
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 50);
  }

  getTree() { return this.repo.findTrees({ relations: ['parent'] }); }

  getRoots() { return this.repo.findRoots(); }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id }, relations: { parent: true } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async findBySlug(slug: string) {
    const c = await this.repo.findOne({ where: { slug }, relations: { parent: true } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async getDescendants(id: string) {
    const cat = await this.findOne(id);
    return this.repo.findDescendants(cat);
  }

  async getAncestors(id: string) {
    const cat = await this.findOne(id);
    return this.repo.findAncestors(cat);
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new ConflictException('Category slug already exists');

    const { parentId, ...rest } = dto;
    const category = this.repo.create({ ...rest, slug });

    if (parentId) {
      category.parent = await this.findOne(parentId);
    }

    return this.repo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const { parentId, ...rest } = dto;

    Object.assign(category, rest);
    if (rest.name) category.slug = slugify(rest.name, { lower: true, strict: true });

    if (parentId !== undefined) {
      category.parent = parentId ? await this.findOne(parentId) : null as unknown as Category;
    }

    return this.repo.save(category);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
