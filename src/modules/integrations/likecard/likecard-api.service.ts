import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  LikeCardApiError,
  LikeCardCircuitOpenError,
  LikeCardNullFieldError,
  LikeCardTimeoutError,
  classifyLikeCardFailure,
  classifyLikeCardHttpFailure,
} from './likecard.exceptions';
import {
  GetOrderDetailsOptions,
  LikeCardBalance,
  LikeCardCategory,
  LikeCardEnvelope,
  LikeCardOrder,
  LikeCardProduct,
  ListOrdersOptions,
} from './likecard.types';

const REQUEST_TIMEOUT_MS = 20_000;
const CREATE_ORDER_RETRY_ATTEMPTS = 6;
const CREATE_ORDER_RETRY_INTERVAL_MS = 10_000;
const HEALTH_CHECK_INTERVAL_MS = 60_000;

/**
 * Low-level client for LikeCard's Integration API (portal.likecard.com). Every request is
 * POST multipart/form-data; auth is deviceId + email + securityCode (no password field).
 * Never log securityCode/hashKey values.
 */
@Injectable()
export class LikeCardApiService {
  private readonly logger = new Logger(LikeCardApiService.name);

  /** Set while create_order has timed out CREATE_ORDER_RETRY_ATTEMPTS times in a row; blocks new orders until the 60s health check sees a normal response again. */
  private circuitOpen = false;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly config: ConfigService) {}

  private get apiUrl(): string {
    return this.config.get<string>('likecard.apiUrl')!;
  }

  private get deviceId(): string {
    return this.config.get<string>('likecard.deviceId')!;
  }

  private get email(): string {
    return this.config.get<string>('likecard.email')!;
  }

  private get securityCode(): string {
    return this.config.get<string>('likecard.securityCode')!;
  }

  private get langId(): number {
    return this.config.get<number>('likecard.langId')!;
  }

  private get hashPhone(): string {
    return this.config.get<string>('likecard.hashPhone')!;
  }

  private get hashKey(): string {
    return this.config.get<string>('likecard.hashKey')!;
  }

  /** True once deviceId/email/securityCode env vars are populated — lets callers treat "not yet configured" as expected, not an error. */
  isConfigured(): boolean {
    return Boolean(this.deviceId && this.email && this.securityCode);
  }

  private generateHash(time: string): string {
    const raw = time + this.email.toLowerCase() + this.hashPhone + this.hashKey;
    return createHash('sha256').update(raw).digest('hex');
  }

  private assertNoNulls(data: Record<string, unknown>, endpoint: string) {
    for (const [key, value] of Object.entries(data)) {
      if (value === null) throw new LikeCardNullFieldError(key, endpoint);
    }
  }

  private async postForm<T>(
    endpoint: string,
    fields: Record<string, string | string[] | undefined>,
    opts: { includeSecurityCode?: boolean } = {},
  ): Promise<T> {
    const { includeSecurityCode = true } = opts;
    const form = new FormData();
    form.append('deviceId', this.deviceId);
    form.append('email', this.email);
    if (includeSecurityCode) form.append('securityCode', this.securityCode);
    form.append('langId', String(this.langId));

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) form.append(key, v);
      } else {
        form.append(key, value);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}/online/${endpoint}`, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new LikeCardTimeoutError(`LikeCard ${endpoint} request timed out after ${REQUEST_TIMEOUT_MS}ms`, endpoint);
      }
      throw new LikeCardApiError(`LikeCard ${endpoint} request failed: ${(err as Error).message}`, endpoint);
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const bodySnippet = (await res.text().catch(() => '')).slice(0, 500);
      throw classifyLikeCardHttpFailure(res.status, bodySnippet, endpoint);
    }

    const envelope = (await res.json()) as LikeCardEnvelope<T>;
    if (envelope.response !== 1) {
      throw classifyLikeCardFailure(envelope.message ?? 'Unknown LikeCard error', endpoint);
    }
    if (envelope.data && typeof envelope.data === 'object') {
      this.assertNoNulls(envelope.data as Record<string, unknown>, endpoint);
    }
    return envelope.data as T;
  }

  async checkBalance(): Promise<LikeCardBalance> {
    return this.postForm<LikeCardBalance>('check_balance', {});
  }

  /** Docs: cache this and only re-check every 5 hours — do not poll more often. */
  async getCategories(): Promise<LikeCardCategory[]> {
    return this.postForm<LikeCardCategory[]>('categories', {});
  }

  /** Docs: sync every 30 minutes and cache products locally. */
  async getProductsByCategory(categoryId: string): Promise<LikeCardProduct[]> {
    return this.postForm<LikeCardProduct[]>('products', { categoryId });
  }

  async getProductsByIds(ids: string[]): Promise<LikeCardProduct[]> {
    return this.postForm<LikeCardProduct[]>('products', { 'ids[]': ids });
  }

  async listOrders(options: ListOrdersOptions = {}): Promise<LikeCardOrder[]> {
    return this.postForm<LikeCardOrder[]>(
      'orders',
      {
        page: options.page ? String(options.page) : undefined,
        orderType: options.orderType,
        fromUnixTime: options.fromUnixTime ? String(options.fromUnixTime) : undefined,
        toUnixTime: options.toUnixTime ? String(options.toUnixTime) : undefined,
      },
      { includeSecurityCode: false },
    );
  }

  /** Docs recommend looking orders up by our own referenceId rather than LikeCard's orderId. */
  async getOrderDetails(options: GetOrderDetailsOptions): Promise<LikeCardOrder> {
    return this.postForm<LikeCardOrder>('orders/details', {
      orderId: options.orderId,
      referenceId: options.referenceId,
    });
  }

  /**
   * Debits the wallet balance. referenceId must be unique per the docs — never reuse one across retries.
   * Implements the docs' exact timeout policy: on timeout, poll orders/details by referenceId up to
   * 6 times / 10s apart to see if the order actually went through; if still inconclusive, open a
   * circuit breaker (no new orders) and health-check every 60s until LikeCard responds normally again.
   */
  async createOrder(productId: string, referenceId: string): Promise<LikeCardOrder> {
    if (this.circuitOpen) {
      throw new LikeCardCircuitOpenError('create_order');
    }

    const time = String(Math.floor(Date.now() / 1000));
    const hash = this.generateHash(time);

    try {
      return await this.postForm<LikeCardOrder>('create_order', {
        productId,
        referenceId,
        quantity: '1',
        time,
        hash,
      });
    } catch (err) {
      if (err instanceof LikeCardTimeoutError) {
        return this.resolveTimedOutOrder(referenceId);
      }
      throw err;
    }
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async resolveTimedOutOrder(referenceId: string): Promise<LikeCardOrder> {
    for (let attempt = 1; attempt <= CREATE_ORDER_RETRY_ATTEMPTS; attempt++) {
      await this.sleep(CREATE_ORDER_RETRY_INTERVAL_MS);
      try {
        const details = await this.getOrderDetails({ referenceId });
        this.logger.warn(`create_order for referenceId=${referenceId} timed out but resolved via orders/details on retry ${attempt}`);
        return details;
      } catch (err) {
        if (err instanceof LikeCardTimeoutError) continue;
        // A conclusive (non-timeout) failure — e.g. "not found" — means the order never went through.
        throw err;
      }
    }

    this.logger.error(
      `create_order for referenceId=${referenceId} still unresolved after ${CREATE_ORDER_RETRY_ATTEMPTS} retries — opening circuit breaker and starting 60s health checks`,
    );
    this.openCircuitBreaker(referenceId);
    throw new LikeCardTimeoutError(
      `create_order for referenceId=${referenceId} timed out and could not be confirmed after ${CREATE_ORDER_RETRY_ATTEMPTS} retries`,
      'create_order',
    );
  }

  private openCircuitBreaker(referenceId: string) {
    if (this.circuitOpen) return;
    this.circuitOpen = true;
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.getOrderDetails({ referenceId });
        this.logger.log('LikeCard health check succeeded — resuming normal create_order calls');
        this.closeCircuitBreaker();
      } catch (err) {
        if (err instanceof LikeCardTimeoutError) return;
        // Any other conclusive response (even an error) proves LikeCard is reachable again.
        this.logger.log('LikeCard health check received a conclusive (non-timeout) response — resuming normal create_order calls');
        this.closeCircuitBreaker();
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  private closeCircuitBreaker() {
    this.circuitOpen = false;
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  isCircuitOpen(): boolean {
    return this.circuitOpen;
  }
}
