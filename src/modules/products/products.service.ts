import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductFaq } from './entities/product-faq.entity';
import { ProductDownload } from './entities/product-download.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
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
    // Read-only join into the Inventory module: used only to aggregate available stock
    // onto Products API responses. Inventory's own service/logic is never touched here.
    @InjectRepository(Inventory) private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  /**
   * Sums available stock (quantity - reservedQuantity, floored at 0) across all
   * warehouses for the given product ids, grouped by productId and variantId.
   * Returns a map of productId -> { total, byVariant: { [variantId]: qty } }.
   */
  private async getStockByProductIds(
    productIds: string[],
  ): Promise<Map<string, { total: number; byVariant: Record<string, number> }>> {
    const result = new Map<string, { total: number; byVariant: Record<string, number> }>();
    if (!productIds.length) return result;

    const rows = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.productId', 'productId')
      .addSelect('inv.variantId', 'variantId')
      .addSelect('SUM(GREATEST(inv.quantity - inv.reservedQuantity, 0))', 'stock')
      .where('inv.productId IN (:...ids)', { ids: productIds })
      .groupBy('inv.productId')
      .addGroupBy('inv.variantId')
      .getRawMany<{ productId: string; variantId: string | null; stock: string }>();

    for (const row of rows) {
      const qty = Number(row.stock) || 0;
      let entry = result.get(row.productId);
      if (!entry) {
        entry = { total: 0, byVariant: {} };
        result.set(row.productId, entry);
      }
      entry.total += qty;
      if (row.variantId) entry.byVariant[row.variantId] = qty;
    }
    return result;
  }

  /** True when a variant can be fulfilled on demand (LikeCard or a generic API supplier) with no local warehouse stock required. */
  private hasSupplierFulfillment(v: ProductVariant): boolean {
    return Boolean(v.likecardProductId) || Boolean(v.giftCardSupplierConfig?.enabled);
  }

  /**
   * Attaches stockQuantity (and per-variant stockQuantity, if variants are loaded) to a product,
   * plus hasSupplierFulfillment — true when a variant is fulfilled on demand via a live supplier
   * API (LikeCard, or a generic configured supplier) rather than requiring local warehouse stock.
   * The storefront must treat these as purchasable even when stockQuantity is 0.
   */
  private async attachStock<T extends Product>(p: T): Promise<T> {
    const stock = await this.getStockByProductIds([p.id]);
    const entry = stock.get(p.id);
    (p as unknown as { stockQuantity: number }).stockQuantity = entry?.total ?? 0;
    let productHasSupplierFulfillment = false;
    if (Array.isArray(p.variants) && p.variants.length) {
      for (const v of p.variants) {
        (v as unknown as { stockQuantity: number }).stockQuantity = entry?.byVariant[v.id] ?? 0;
        const supplierFulfillment = this.hasSupplierFulfillment(v);
        (v as unknown as { hasSupplierFulfillment: boolean }).hasSupplierFulfillment = supplierFulfillment;
        if (supplierFulfillment) productHasSupplierFulfillment = true;
      }
    }
    (p as unknown as { hasSupplierFulfillment: boolean }).hasSupplierFulfillment = productHasSupplierFulfillment;
    return p;
  }

  async findAll(query: ProductQueryDto, isStaff = false) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.images', 'images', 'images.isFeatured = true')
      .skip(skip).take(take);

    if (query.search) qb.andWhere('(p.name LIKE :s OR p.sku LIKE :s OR p.barcode LIKE :s)', { s: `%${query.search}%` });
    if (!isStaff) {
      qb.andWhere('p.isActive = :a', { a: true });
    } else if (query.isActive !== undefined) {
      qb.andWhere('p.isActive = :a', { a: query.isActive });
    }
    if (query.isFeatured !== undefined) qb.andWhere('p.isFeatured = :f', { f: query.isFeatured });
    if (query.isPreorder !== undefined) qb.andWhere('p.isPreorder = :pre', { pre: query.isPreorder });
    if (query.isComingSoon !== undefined) qb.andWhere('p.isComingSoon = :cs', { cs: query.isComingSoon });
    if (query.brandId) qb.andWhere('p.brandId = :bid', { bid: query.brandId });
    if (query.platform?.length) qb.andWhere('p.platform IN (:...plat)', { plat: query.platform });
    if (query.region?.length) qb.andWhere('p.region IN (:...reg)', { reg: query.region });
    if (query.genre?.length) qb.andWhere('p.genre IN (:...gen)', { gen: query.genre });
    if (query.minPrice !== undefined) qb.andWhere('p.price >= :min', { min: query.minPrice });
    if (query.maxPrice !== undefined) qb.andWhere('p.price <= :max', { max: query.maxPrice });
    if (query.categoryId) {
      qb.andWhere('p.categoryId = :cid', { cid: query.categoryId });
    }
    if (query.type?.length) qb.andWhere('p.type IN (:...ptype)', { ptype: query.type });
    if (query.inStock) {
      qb.andWhere(`EXISTS (SELECT 1 FROM inventory inv WHERE inv.productId = p.id AND (inv.quantity - inv.reservedQuantity) > 0)`);
    }
    if (query.isOnSale) {
      qb.andWhere('p.salePrice IS NOT NULL AND p.salePrice < p.price');
    }

    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    if (query.sortBy === 'soldCount') {
      qb.leftJoin(
        (sub) =>
          sub
            .select('oi.productId', 'productId')
            .addSelect('SUM(oi.quantity)', 'soldCount')
            .from(OrderItem, 'oi')
            .groupBy('oi.productId'),
        'soldStats',
        'soldStats.productId = p.id',
      )
        .addSelect('COALESCE(soldStats.soldCount, 0)', 'soldCount')
        .orderBy('soldCount', sortOrder);
    } else {
      const sortField = ['price', 'name', 'createdAt', 'avgRating', 'reviewCount'].includes(query.sortBy ?? '')
        ? `p.${query.sortBy}` : 'p.createdAt';
      qb.orderBy(sortField, sortOrder);
    }

    const [items, total] = await qb.getManyAndCount();

    // Single grouped query aggregating Inventory across the current page of products,
    // rather than N+1 lookups. Cheap enough to include on the list endpoint too.
    if (items.length) {
      const stockMap = await this.getStockByProductIds(items.map((i) => i.id));
      for (const item of items) {
        (item as unknown as { stockQuantity: number }).stockQuantity = stockMap.get(item.id)?.total ?? 0;
      }
    }

    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string, isStaff = false) {
    const p = await this.repo.findOne({
      where: { id },
      relations: {
        brand: true, category: true, images: true, variants: true, specifications: true, faqs: true,
        relatedProducts: true, upsellProducts: true, crossSellProducts: true,
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    if (!isStaff && !p.isActive) throw new NotFoundException('Product not found');
    return this.attachStock(p);
  }

  async findBySlug(slug: string, isStaff = false) {
    const p = await this.repo.findOne({
      where: { slug },
      relations: { brand: true, category: true, images: true, variants: true, specifications: true, faqs: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    if (!isStaff && !p.isActive) throw new NotFoundException('Product not found');
    return this.attachStock(p);
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


