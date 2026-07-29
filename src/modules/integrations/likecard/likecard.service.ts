import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { LikeCardApiService } from './likecard-api.service';
import { Product, ProductRegion, ProductType, ProductPlatform } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Category } from '../../categories/entities/category.entity';
import { LikeCardCategory, LikeCardProduct } from './likecard.types';
import { LikeCardApiError } from './likecard.exceptions';

const REGION_NAME_MAP: Record<string, ProductRegion> = {
  'saudi arabia': ProductRegion.KSA,
  ksa: ProductRegion.KSA,
  'united arab emirates': ProductRegion.UAE,
  uae: ProductRegion.UAE,
  oman: ProductRegion.OMAN,
  kuwait: ProductRegion.KUWAIT,
  qatar: ProductRegion.QATAR,
  bahrain: ProductRegion.BAHRAIN,
};

function matchRegion(categoryName: string): ProductRegion | null {
  const key = categoryName.trim().toLowerCase();
  return REGION_NAME_MAP[key] ?? null;
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
      nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])]);
    const all = flatten(categories);
    const playstation = all.find((c) => c.name.trim().toLowerCase().includes('playstation'));
    if (!playstation) return [];
    return playstation.children ?? [];
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
      const region = matchRegion(cat.name);
      if (!region) {
        result.skippedNoRegionMatch.push(cat.name);
        this.logger.warn(`LikeCard PlayStation sub-category "${cat.name}" (id=${cat.id}) did not match a known ProductRegion — skipped`);
        continue;
      }
      result.regionsFound.push({ categoryId: cat.id, categoryName: cat.name, region });

      const products = await this.api.getProductsByCategory(cat.id);
      for (const lcProduct of products) {
        const created = await this.upsertProductFromLikeCard(lcProduct, region, markupPercentOverride);
        if (created) result.productsCreated++;
        else result.productsUpdated++;
      }
    }

    return result;
  }

  /** Returns true if a new Product was created, false if an existing one was updated. */
  private async upsertProductFromLikeCard(
    lcProduct: LikeCardProduct,
    region: ProductRegion,
    markupPercentOverride?: number,
  ): Promise<boolean> {
    const existingVariant = await this.variantRepo.findOne({ where: { likecardProductId: lcProduct.id } });
    const price = this.applyMarkup(lcProduct.costPrice ?? lcProduct.price, markupPercentOverride);

    if (existingVariant) {
      existingVariant.price = price;
      await this.variantRepo.save(existingVariant);
      const product = await this.productRepo.findOne({ where: { id: existingVariant.productId } });
      if (product) {
        product.price = price;
        if (lcProduct.costPrice !== undefined) product.costPrice = lcProduct.costPrice;
        await this.productRepo.save(product);
      }
      return false;
    }

    // Customer-facing name/description are written fresh here — never copy LikeCard's own
    // product name/branding verbatim, since it may reference the wholesale supplier.
    const displayName = `PlayStation Store Gift Card — ${this.regionLabel(region)} — ${lcProduct.name.replace(/likecard|like4card/gi, '').trim()}`.trim();
    const sku = `LC-PSN-${lcProduct.id}`;
    const slug = await this.generateUniqueSlug(displayName);
    const categoryId = await this.getOrCreateGiftCardsCategory();

    const product = this.productRepo.create({
      name: displayName,
      slug,
      sku,
      type: ProductType.DIGITAL,
      platform: ProductPlatform.PS5,
      region,
      categoryId,
      price,
      costPrice: lcProduct.costPrice ?? null,
      isActive: true,
      shortDescription: `Digital PlayStation Store gift card for the ${this.regionLabel(region)} store.`,
    });
    await this.productRepo.save(product);

    const variant = this.variantRepo.create({
      productId: product.id,
      sku: `${sku}-DEFAULT`,
      price,
      options: [],
      isActive: true,
      likecardProductId: lcProduct.id,
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
    return products.find((p) => p.id === likecardProductId) ?? null;
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
