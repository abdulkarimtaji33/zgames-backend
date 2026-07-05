import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductFaq } from './entities/product-faq.entity';
import { ProductDownload } from './entities/product-download.entity';
import {
  CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateProductVariantDto, UpdateProductVariantDto,
  AddProductImageDto, SetRelatedProductsDto, ReorderImagesDto,
} from './dto/product.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductSpecification) private readonly specRepo: Repository<ProductSpecification>,
    @InjectRepository(ProductFaq) private readonly faqRepo: Repository<ProductFaq>,
    @InjectRepository(ProductDownload) private readonly downloadRepo: Repository<ProductDownload>,
  ) {}

  async findAll(query: ProductQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.images', 'images', 'images.isFeatured = true')
      .skip(skip).take(take);

    if (query.search) qb.andWhere('(p.name LIKE :s OR p.sku LIKE :s OR p.barcode LIKE :s)', { s: `%${query.search}%` });
    if (query.isActive !== undefined) qb.andWhere('p.isActive = :a', { a: query.isActive });
    if (query.isFeatured !== undefined) qb.andWhere('p.isFeatured = :f', { f: query.isFeatured });
    if (query.isPreorder !== undefined) qb.andWhere('p.isPreorder = :pre', { pre: query.isPreorder });
    if (query.isComingSoon !== undefined) qb.andWhere('p.isComingSoon = :cs', { cs: query.isComingSoon });
    if (query.brandId) qb.andWhere('p.brandId = :bid', { bid: query.brandId });
    if (query.platform) qb.andWhere('p.platform = :plat', { plat: query.platform });
    if (query.region) qb.andWhere('p.region = :reg', { reg: query.region });
    if (query.genre) qb.andWhere('p.genre = :gen', { gen: query.genre });
    if (query.minPrice !== undefined) qb.andWhere('p.price >= :min', { min: query.minPrice });
    if (query.maxPrice !== undefined) qb.andWhere('p.price <= :max', { max: query.maxPrice });
    if (query.categoryId) {
      qb.leftJoin('p.categories', 'cat').andWhere('cat.id = :cid', { cid: query.categoryId });
    }

    const sortField = ['price', 'name', 'createdAt', 'avgRating', 'reviewCount'].includes(query.sortBy ?? '')
      ? `p.${query.sortBy}` : 'p.createdAt';
    qb.orderBy(sortField, query.sortOrder === 'ASC' ? 'ASC' : 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({
      where: { id },
      relations: {
        brand: true, category: true, images: true, variants: true, specifications: true, faqs: true,
        relatedProducts: true, upsellProducts: true, crossSellProducts: true,
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async findBySlug(slug: string) {
    const p = await this.repo.findOne({
      where: { slug },
      relations: { brand: true, category: true, images: true, variants: true, specifications: true, faqs: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;
    while (true) {
      const qb = this.repo.createQueryBuilder('p').where('p.slug = :slug', { slug });
      if (excludeId) qb.andWhere('p.id != :id', { id: excludeId });
      const exists = await qb.getOne();
      if (!exists) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  async create(dto: CreateProductDto) {
    const { categoryIds, ...rest } = dto;
    const slug = await this.generateUniqueSlug(dto.name);
    const product = this.repo.create({ ...rest, slug });

    if (categoryIds?.length) {
      product.categoryId = categoryIds[0];
    }

    return this.repo.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const { categoryIds, ...rest } = dto;

    Object.assign(product, rest);
    if (rest.name) product.slug = await this.generateUniqueSlug(rest.name, id);
    if (categoryIds !== undefined && categoryIds.length > 0) {
      product.categoryId = categoryIds[0];
    }

    return this.repo.save(product);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }

  // ── Variants ──────────────────────────────────────────────────────────────
  async getVariants(productId: string) {
    await this.findOne(productId);
    return this.variantRepo.find({ where: { productId }, order: { sortOrder: 'ASC' } });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    await this.findOne(productId);
    const exists = await this.variantRepo.findOne({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException('SKU already exists');
    return this.variantRepo.save(this.variantRepo.create({ ...dto, productId }));
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateProductVariantDto) {
    const v = await this.variantRepo.findOne({ where: { id: variantId, productId } });
    if (!v) throw new NotFoundException('Variant not found');
    await this.variantRepo.update(variantId, dto);
    return this.variantRepo.findOne({ where: { id: variantId } });
  }

  async removeVariant(productId: string, variantId: string) {
    const v = await this.variantRepo.findOne({ where: { id: variantId, productId } });
    if (!v) throw new NotFoundException('Variant not found');
    await this.variantRepo.softDelete(variantId);
  }

  // ── Images ────────────────────────────────────────────────────────────────
  async getImages(productId: string) {
    await this.findOne(productId);
    return this.imageRepo.find({ where: { productId }, order: { sortOrder: 'ASC' } });
  }

  async addImage(productId: string, dto: AddProductImageDto) {
    await this.findOne(productId);
    if (dto.isFeatured) await this.imageRepo.update({ productId }, { isFeatured: false });
    const { alt, ...rest } = dto;
    return this.imageRepo.save(this.imageRepo.create({ ...rest, altText: alt, productId }));
  }

  async removeImage(productId: string, imageId: string) {
    const img = await this.imageRepo.findOne({ where: { id: imageId, productId } });
    if (!img) throw new NotFoundException('Image not found');
    await this.imageRepo.delete(imageId);
  }

  async setPrimaryImage(productId: string, imageId: string) {
    await this.imageRepo.update({ productId }, { isFeatured: false });
    await this.imageRepo.update(imageId, { isFeatured: true });
    return this.imageRepo.findOne({ where: { id: imageId } });
  }

  async reorderImages(productId: string, dto: ReorderImagesDto) {
    await Promise.all(dto.imageIds.map((imageId, index) =>
      this.imageRepo.update({ id: imageId, productId }, { sortOrder: index }),
    ));
    return this.getImages(productId);
  }

  // ── Related products ──────────────────────────────────────────────────────
  async setRelated(id: string, dto: SetRelatedProductsDto) {
    const product = await this.findOne(id);
    product.relatedProducts = dto.productIds.map((pid) => ({ id: pid }) as never);
    return this.repo.save(product);
  }

  async setUpsell(id: string, dto: SetRelatedProductsDto) {
    const product = await this.findOne(id);
    product.upsellProducts = dto.productIds.map((pid) => ({ id: pid }) as never);
    return this.repo.save(product);
  }

  async setCrosssell(id: string, dto: SetRelatedProductsDto) {
    const product = await this.findOne(id);
    product.crossSellProducts = dto.productIds.map((pid) => ({ id: pid }) as never);
    return this.repo.save(product);
  }

  async updateRating(productId: string, avgRating: number, reviewCount: number) {
    await this.repo.update(productId, { avgRating, reviewCount });
  }
}


