import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCardCode, GiftCardCodeStatus, GiftCardCodeSource } from './entities/gift-card-code.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { GiftCardSupplierConfigDto } from './dto/gift-card-code.dto';

export interface AssignCodesResult {
  codes: string[];
  shortfall: number;
}

@Injectable()
export class GiftCardCodesService {
  private readonly logger = new Logger(GiftCardCodesService.name);

  constructor(
    @InjectRepository(GiftCardCode) private readonly repo: Repository<GiftCardCode>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  async bulkUpload(productId: string, variantId: string | undefined, rawCodes: string[]) {
    const codes = rawCodes.map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) throw new BadRequestException('No codes provided');
    const entities = codes.map((code) =>
      this.repo.create({
        productId,
        variantId: variantId ?? null,
        code,
        status: GiftCardCodeStatus.AVAILABLE,
        source: GiftCardCodeSource.MANUAL,
      }),
    );
    await this.repo.save(entities);
    return { uploaded: entities.length };
  }

  async listByProduct(productId: string, variantId?: string, status?: GiftCardCodeStatus) {
    const where: Record<string, unknown> = { productId };
    if (variantId) where.variantId = variantId;
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async stats(productId: string) {
    const codes = await this.repo.find({ where: { productId } });
    const byVariant = new Map<string, { available: number; sold: number; disabled: number }>();
    for (const c of codes) {
      const key = c.variantId ?? '__none__';
      if (!byVariant.has(key)) byVariant.set(key, { available: 0, sold: 0, disabled: 0 });
      const bucket = byVariant.get(key)!;
      if (c.status === GiftCardCodeStatus.AVAILABLE) bucket.available++;
      else if (c.status === GiftCardCodeStatus.SOLD) bucket.sold++;
      else bucket.disabled++;
    }
    return Array.from(byVariant.entries()).map(([variantId, counts]) => ({
      variantId: variantId === '__none__' ? null : variantId,
      ...counts,
    }));
  }

  async deleteCode(id: string) {
    const code = await this.repo.findOne({ where: { id } });
    if (!code) throw new NotFoundException('Code not found');
    if (code.status === GiftCardCodeStatus.SOLD) throw new BadRequestException('Cannot delete a code that has already been sold');
    await this.repo.delete(id);
    return { success: true };
  }

  async configureSupplier(variantId: string, dto: GiftCardSupplierConfigDto) {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.giftCardSupplierConfig = {
      enabled: dto.enabled,
      apiUrl: dto.apiUrl ?? '',
      apiKey: dto.apiKey,
      method: dto.method ?? 'POST',
      bodyTemplate: dto.bodyTemplate,
      codePath: dto.codePath ?? 'codes',
    };
    await this.variantRepo.save(variant);
    return variant.giftCardSupplierConfig;
  }

  private getByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  }

  /** Attempts to fetch `quantity` codes from a configured third-party supplier API. */
  private async fetchFromSupplier(variant: ProductVariant, quantity: number): Promise<string[]> {
    const cfg = variant.giftCardSupplierConfig;
    if (!cfg?.enabled || !cfg.apiUrl) return [];
    try {
      const body = cfg.bodyTemplate
        ? cfg.bodyTemplate.replace('{{quantity}}', String(quantity)).replace('{{sku}}', variant.sku)
        : JSON.stringify({ sku: variant.sku, quantity });
      const res = await fetch(cfg.apiUrl, {
        method: cfg.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: cfg.method === 'GET' ? undefined : body,
      });
      if (!res.ok) {
        this.logger.error(`Supplier API for variant ${variant.id} returned ${res.status}`);
        return [];
      }
      const json = await res.json();
      const raw = this.getByPath(json, cfg.codePath ?? 'codes');
      const codes = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? [raw] : [];
      return codes.slice(0, quantity);
    } catch (err) {
      this.logger.error(`Supplier API call failed for variant ${variant.id}: ${err}`);
      return [];
    }
  }

  /** Pulls codes from local inventory, falling back to the configured API supplier when stock is short. */
  async assignCodesForOrderItem(params: {
    productId: string;
    variantId: string | null;
    quantity: number;
    orderId: string;
    orderItemId: string;
    customerId: string | null;
  }): Promise<AssignCodesResult> {
    const { productId, variantId, quantity, orderId, orderItemId, customerId } = params;
    const codes: string[] = [];

    const available = await this.repo.find({
      where: { productId, variantId: variantId ?? undefined, status: GiftCardCodeStatus.AVAILABLE },
      take: quantity,
      order: { createdAt: 'ASC' },
    });
    for (const c of available) {
      c.status = GiftCardCodeStatus.SOLD;
      c.orderId = orderId;
      c.orderItemId = orderItemId;
      c.customerId = customerId;
      c.soldAt = new Date();
      codes.push(c.code);
    }
    if (available.length) await this.repo.save(available);

    let shortfall = quantity - codes.length;
    if (shortfall > 0 && variantId) {
      const variant = await this.variantRepo.findOne({ where: { id: variantId } });
      if (variant?.giftCardSupplierConfig?.enabled) {
        const fetched = await this.fetchFromSupplier(variant, shortfall);
        if (fetched.length) {
          const entities = fetched.map((code) =>
            this.repo.create({
              productId,
              variantId,
              code,
              status: GiftCardCodeStatus.SOLD,
              source: GiftCardCodeSource.API,
              orderId,
              orderItemId,
              customerId,
              soldAt: new Date(),
            }),
          );
          await this.repo.save(entities);
          codes.push(...fetched);
          shortfall = quantity - codes.length;
        }
      }
    }

    return { codes, shortfall: Math.max(0, shortfall) };
  }

  /** Admin manually types in a code for an order item stuck pending fulfillment (e.g. out of stock). */
  async manuallyAssignCode(params: { productId: string; variantId: string | null; orderId: string; orderItemId: string; customerId: string | null; code: string }) {
    const entity = this.repo.create({
      productId: params.productId,
      variantId: params.variantId,
      code: params.code.trim(),
      status: GiftCardCodeStatus.SOLD,
      source: GiftCardCodeSource.MANUAL,
      orderId: params.orderId,
      orderItemId: params.orderItemId,
      customerId: params.customerId,
      soldAt: new Date(),
    });
    return this.repo.save(entity);
  }

  async lowStock(threshold = 5) {
    const stats = await this.repo
      .createQueryBuilder('c')
      .select('c.productId', 'productId')
      .addSelect('c.variantId', 'variantId')
      .addSelect('SUM(CASE WHEN c.status = :available THEN 1 ELSE 0 END)', 'available')
      .setParameter('available', GiftCardCodeStatus.AVAILABLE)
      .groupBy('c.productId')
      .addGroupBy('c.variantId')
      .having('available < :threshold', { threshold })
      .getRawMany();
    return stats;
  }
}
