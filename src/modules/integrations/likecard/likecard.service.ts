import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { LikeCardApiService } from './likecard-api.service';
import { Product, ProductRegion, ProductType, ProductPlatform } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { ProductImage } from '../../products/entities/product-image.entity';
import { Category } from '../../categories/entities/category.entity';
import { LikeCardCategory, LikeCardProduct } from './likecard.types';
import { LikeCardApiError } from './likecard.exceptions';

// LikeCard's real PlayStation sub-category names are formatted like "PSN - UAE", "PSN - Saudi
// Arabia", etc. (confirmed live) — match by keyword contained in the name, not exact equality.
const REGION_KEYWORDS: Array<{ keywords: string[]; region: ProductRegion }> = [
  { keywords: ['saudi arabia', 'ksa'], region: ProductRegion.KSA },
  { keywords: ['uae', 'united arab emirates'], region: ProductRegion.UAE },
  { keywords: ['oman'], region: ProductRegion.OMAN },
  { keywords: ['kuwait'], region: ProductRegion.KUWAIT },
  { keywords: ['qatar'], region: ProductRegion.QATAR },
  { keywords: ['bahrain'], region: ProductRegion.BAHRAIN },
];

function matchRegion(categoryName: string): ProductRegion | null {
  const lower = categoryName.trim().toLowerCase();
  for (const { keywords, region } of REGION_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return region;
  }
  return null;
}

export interface CatalogSyncResult {
  regionsFound: Array<{ categoryId: string; categoryName: string; region: ProductRegion }>;
  productsCreated: number;
  productsUpdated: number;
  skippedNoRegionMatch: string[];
}

export interface CatalogSyncStatus {
  linkedVariants: number;
  totalVariants: number;
  unlinkedProducts: Array<{ productId: string; name: string; variantId: string }>;
}

/**
 * Business-logic layer over LikeCardApiService: catalog sync into local Product/ProductVariant
 * rows, balance/pricing guards, and the two-step order-safety flow used by gift-card fulfillment.
 * Storefront-visible copy is always written fresh here — LikeCard's own names/branding are never
 * persisted into customer-facing fields.
 */
@Injectable()
export class LikeCardService {
  private readonly logger = new Logger(LikeCardService.name);

  constructor(
    private readonly api: LikeCardApiService,
    private readonly config: ConfigService,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  private giftCardsCategoryId: string | null = null;

  /** Storefront browse/purchase page for synced products is /[locale]/category/gift-cards — ensure that category exists. */
  private async getOrCreateGiftCardsCategory(): Promise<string> {
    if (this.giftCardsCategoryId) return this.giftCardsCategoryId;
    let category = await this.categoryRepo.findOne({ where: { slug: 'gift-cards' } });
    if (!category) {
      category = this.categoryRepo.create({
        name: 'Gift Cards',
        slug: 'gift-cards',
        description: 'Digital gift cards and store credit for gaming platforms.',
        isActive: true,
      });
      await this.categoryRepo.save(category);
      this.logger.log('Created missing "gift-cards" category for LikeCard-synced products');
    }
    this.giftCardsCategoryId = category.id;
    return category.id;
  }

  isConfigured(): boolean {
    return this.api.isConfigured();
  }

  private get markupPercent(): number {
    return this.config.get<number>('likecard.markupPercent')!;
  }

  async checkBalance() {
    if (!this.isConfigured()) {
      return { configured: false as const };
    }
    const balance = await this.api.checkBalance();
    return { configured: true as const, ...balance };
  }

  private applyMarkup(costPrice: number, markupPercentOverride?: number): number {
    const percent = markupPercentOverride ?? this.markupPercent;
    return Math.round(costPrice * (1 + percent / 100) * 100) / 100;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 2;
    for (;;) {
      const exists = await this.productRepo.findOne({ where: { slug } });
      if (!exists) return slug;
      slug = `${base}-${counter++}`;
    }
  }

  /** Finds the "PlayStation" node in LikeCard's category tree and its direct region sub-categories. */
  private findPlaystationRegionCategories(categories: LikeCardCategory[]): LikeCardCategory[] {
    const flatten = (nodes: LikeCardCategory[]): LikeCardCategory[] =>
      nodes.flatMap((n) => [n, ...(n.childs ? flatten(n.childs) : [])]);
    const all = flatten(categories);
    const playstation = all.find((c) => c.categoryName.trim().toLowerCase() === 'playstation');
    if (!playstation) return [];
    return playstation.childs ?? [];
  }

  /**
   * Pulls PlayStation categories/products from LikeCard and upserts local Product/ProductVariant
   * rows. Region sub-category IDs are discovered live from the categories response (not hardcoded)
   * since real IDs are only known once credentials/IP whitelisting are in place.
   */
  async syncPlaystationCatalog(markupPercentOverride?: number): Promise<CatalogSyncResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('LikeCard is not yet configured (missing deviceId/email/securityCode env vars).');
    }

    const categories = await this.api.getCategories();
    const regionCategories = this.findPlaystationRegionCategories(categories);

    const result: CatalogSyncResult = {
      regionsFound: [],
      productsCreated: 0,
      productsUpdated: 0,
      skippedNoRegionMatch: [],
    };

    for (const cat of regionCategories) {
      const region = matchRegion(cat.categoryName);
      if (!region) {
        result.skippedNoRegionMatch.push(cat.categoryName);
        this.logger.warn(`LikeCard PlayStation sub-category "${cat.categoryName}" (id=${cat.id}) did not match a known ProductRegion — skipped`);
        continue;
      }
      result.regionsFound.push({ categoryId: cat.id, categoryName: cat.categoryName, region });

      const products = await this.api.getProductsByCategory(cat.id);
      for (const lcProduct of products) {
        if (lcProduct.productName?.toLowerCase().includes('demo')) {
          this.logger.log(`Skipping LikeCard demo product "${lcProduct.productName}" (id=${lcProduct.productId})`);
          continue;
        }
        const created = await this.upsertProductFromLikeCard(lcProduct, region, markupPercentOverride);
        if (created) result.productsCreated++;
        else result.productsUpdated++;
      }
    }

    return result;
  }

  /** Extracts the denomination portion of a LikeCard product name (e.g. "USD 50") for our own display name. */
  private extractDenomination(productName: string): string {
    const match = productName.match(/(?:USD|AED|SAR|KWD|OMR|BHD|QAR)\s*\d+(\.\d+)?/i);
    return match ? match[0] : productName.replace(/likecard|like4card/gi, '').trim();
  }

  /** Returns true if a new Product was created, false if an existing one was updated. */
  private async upsertProductFromLikeCard(
    lcProduct: LikeCardProduct,
    region: ProductRegion,
    markupPercentOverride?: number,
  ): Promise<boolean> {
    const existingVariant = await this.variantRepo.findOne({ where: { likecardProductId: lcProduct.productId } });
    const price = this.applyMarkup(lcProduct.productPrice, markupPercentOverride);
    const isActive = lcProduct.available !== false;

    if (existingVariant) {
      existingVariant.price = price;
      existingVariant.isActive = isActive;
      await this.variantRepo.save(existingVariant);
      const product = await this.productRepo.findOne({ where: { id: existingVariant.productId } });
      if (product) {
        product.price = price;
        product.costPrice = lcProduct.productPrice;
        product.isActive = isActive;
        await this.productRepo.save(product);
      }
      return false;
    }

    // Customer-facing name/description are written fresh here — never copy LikeCard's own
    // product name/branding verbatim, since it may reference the wholesale supplier.
    const displayName = `PlayStation Store Gift Card — ${this.regionLabel(region)} — ${this.extractDenomination(lcProduct.productName)}`.trim();
    const sku = `LC-PSN-${lcProduct.productId}`;
    const slug = await this.generateUniqueSlug(displayName);
    const categoryId = await this.getOrCreateGiftCardsCategory();

    const product = this.productRepo.create({
      name: displayName,
      slug,
      sku,
      type: ProductType.DIGITAL,
      // PSN wallet credit works on any PlayStation hardware (PS4/PS5 alike) — never tag as PS5
      // specifically, or it wrongly floods PS5-hardware-only storefront rails/filters.
      platform: ProductPlatform.MULTI,
      region,
      categoryId,
      price,
      costPrice: lcProduct.productPrice,
      isActive,
      shortDescription: `Digital PlayStation Store gift card for the ${this.regionLabel(region)} store.`,
    });
    await this.productRepo.save(product);

    // Prefer the branding-free "white label" image variant LikeCard provides — never surface
    // their own (possibly branded) product image to customers.
    const imageUrl = lcProduct.productImageWhiteLabel || lcProduct.productImage;
    if (imageUrl) {
      await this.imageRepo.save(
        this.imageRepo.create({
          productId: product.id,
          url: imageUrl,
          altText: displayName,
          isFeatured: true,
          sortOrder: 0,
        }),
      );
    }

    const variant = this.variantRepo.create({
      productId: product.id,
      sku: `${sku}-DEFAULT`,
      price,
      options: [],
      isActive,
      likecardProductId: lcProduct.productId,
    });
    await this.variantRepo.save(variant);

    return true;
  }

  private regionLabel(region: ProductRegion): string {
    switch (region) {
      case ProductRegion.UAE:
        return 'UAE';
      case ProductRegion.KSA:
        return 'Saudi Arabia';
      case ProductRegion.KUWAIT:
        return 'Kuwait';
      case ProductRegion.OMAN:
        return 'Oman';
      case ProductRegion.QATAR:
        return 'Qatar';
      case ProductRegion.BAHRAIN:
        return 'Bahrain';
      default:
        return region;
    }
  }

  async getSyncStatus(): Promise<CatalogSyncStatus> {
    const total = await this.variantRepo.count();
    const unlinked = await this.variantRepo
      .createQueryBuilder('v')
      .innerJoin(Product, 'p', 'p.id = v.productId')
      .where('p.type = :type', { type: ProductType.DIGITAL })
      .andWhere('v.likecardProductId IS NULL')
      .select(['v.id AS variantId', 'v.productId AS productId', 'p.name AS name'])
      .getRawMany();

    const linkedCount = await this.variantRepo
      .createQueryBuilder('v')
      .where('v.likecardProductId IS NOT NULL')
      .getCount();

    return {
      linkedVariants: linkedCount,
      totalVariants: total,
      unlinkedProducts: unlinked.map((r) => ({ productId: r.productId, name: r.name, variantId: r.variantId })),
    };
  }

  /**
   * Two-step order safety (per docs): verify LikeCard still has this product available (and get
   * its current cost price) before the caller charges the customer. Called immediately before
   * createOrder(). Returns null if the product wasn't found — callers must treat that as "stop".
   */
  async getLiveProduct(likecardProductId: string): Promise<LikeCardProduct | null> {
    const products = await this.api.getProductsByIds([likecardProductId]);
    return products.find((p) => p.productId === likecardProductId) ?? null;
  }

  /**
   * Enforces the docs' strict pricing rule: never sell at zero, never sell below LikeCard's cost.
   * Throws rather than returning a boolean so callers can't accidentally ignore a violation.
   */
  assertPricingIsSafe(ourSalePrice: number, likecardCostPrice: number) {
    if (ourSalePrice <= 0) {
      throw new BadRequestException('Refusing to fulfill via LikeCard: sale price is zero or negative.');
    }
    if (ourSalePrice < likecardCostPrice) {
      throw new BadRequestException('Refusing to fulfill via LikeCard: sale price is below LikeCard cost price.');
    }
  }

  /**
   * Debits LikeCard's wallet for exactly one unit and returns the delivered code. Quantity is
   * always 1 per the docs — callers needing N codes call this N times with distinct referenceIds.
   */
  async fulfillSingleUnit(likecardProductId: string, referenceId: string): Promise<{ code: string; likecardOrderId: string }> {
    const order = await this.api.createOrder(likecardProductId, referenceId);
    const code = order.codes?.[0];
    if (!code) {
      throw new LikeCardApiError('LikeCard create_order succeeded but returned no code', 'create_order');
    }
    return { code, likecardOrderId: order.orderId };
  }
}
