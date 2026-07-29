import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentEntityStatus, PaymentMethod } from './entities/payment.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus as OrderPaymentStatus } from '../orders/entities/order.entity';

export interface RequestingUser {
  id: string;
  roles?: Array<{ name: string } | string>;
}

function isStaff(user?: RequestingUser): boolean {
  return Array.isArray(user?.roles) && user.roles.length > 0;
}

@Injectable()
export class PaymentsService {
  private stripe: unknown;

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(PaymentTransaction) private readonly txRepo: Repository<PaymentTransaction>,
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    const stripeKey = config.get<string>('stripe.secretKey');
    if (stripeKey) {
      import('stripe').then(({ default: Stripe }) => {
        this.stripe = new Stripe(stripeKey);
      }).catch(() => {});
    }
  }

  async findByOrder(orderId: string, requester?: RequestingUser) {
    if (requester && !isStaff(requester)) {
      const order = await this.ordersService.findOne(orderId);
      if (order.customerId !== requester.id) throw new NotFoundException('Order not found');
    }
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  /** `requester` is omitted for internal call sites; pass it for any customer-reachable route so ownership is enforced. */
  async findOne(id: string, requester?: RequestingUser) {
    const p = await this.repo.findOne({ where: { id }, relations: { transactions: true } });
    if (!p) throw new NotFoundException('Payment not found');
    if (requester && !isStaff(requester)) {
      const order = await this.ordersService.findOne(p.orderId);
      if (order.customerId !== requester.id) throw new NotFoundException('Payment not found');
    }
    return p;
  }

  async createIntent(dto: CreatePaymentIntentDto): Promise<Payment> {
    const order = await this.ordersService.findOne(dto.orderId);

    // Idempotency: lock any existing Payment rows for this order (pessimistic write, inside a
    // transaction) before deciding whether to create a new one — this serializes concurrent
    // createIntent calls for the same order (double-click, retry, page reload) instead of each
    // racing past a plain SELECT and creating its own duplicate Payment + live gateway intent.
    const paymentId = await this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .createQueryBuilder(Payment, 'p')
        .setLock('pessimistic_write')
        .where('p.orderId = :orderId', { orderId: dto.orderId })
        .getMany();

      if (existing.some((p) => p.status === PaymentEntityStatus.COMPLETED)) {
        throw new BadRequestException('This order has already been paid');
      }
      const reusable = existing.find((p) => p.status === PaymentEntityStatus.PENDING && p.method === dto.method);
      if (reusable) return reusable.id;

      const created = await manager.save(
        Payment,
        manager.create(Payment, {
          orderId: dto.orderId,
          method: dto.method,
          status: PaymentEntityStatus.PENDING,
          amount: Number(order.total),
          currency: dto.currency ?? order.currency ?? 'AED',
        }),
      );
      return created.id;
    });

    const payment = await this.findOne(paymentId);
    if (payment.gatewayPaymentId || payment.status !== PaymentEntityStatus.PENDING) {
      // Reused an existing intent that's already fully set up (or already progressed) — return as-is.
      return payment;
    }

    if (dto.method === PaymentMethod.STRIPE && this.stripe) {
      const stripe = this.stripe as Record<string, unknown>;
      try {
        const pi = await (stripe.paymentIntents as { create: (opts: Record<string, unknown>) => Promise<{ id: string; client_secret: string }> }).create({
          amount: Math.round(Number(order.total) * 100),
          currency: (dto.currency ?? 'aed').toLowerCase(),
          metadata: { orderId: dto.orderId, paymentId: payment.id },
        });
        await this.repo.update(payment.id, {
          gatewayPaymentId: pi.id,
          metadata: { clientSecret: pi.client_secret } as never,
        });
        return this.findOne(payment.id);
      } catch (err) {
        await this.repo.update(payment.id, { status: PaymentEntityStatus.FAILED });
        throw new BadRequestException('Failed to create Stripe payment intent');
      }
    }

    if (dto.method === PaymentMethod.COD) {
      await this.repo.update(payment.id, { status: PaymentEntityStatus.PENDING });
    }

    return this.findOne(payment.id);
  }

  async confirm(dto: ConfirmPaymentDto): Promise<Payment> {
    // Locks this payment's row (and re-checks under the lock) so two near-simultaneous confirm
    // calls for the same payment (e.g. duplicate webhook deliveries) can't both pass the
    // already-completed check before either commits.
    const alreadyCompleted = await this.dataSource.transaction(async (manager) => {
      const payment = await manager
        .createQueryBuilder(Payment, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: dto.paymentId })
        .getOne();
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === PaymentEntityStatus.COMPLETED) {
        throw new BadRequestException('Payment already completed');
      }

      // Guard against a sibling Payment row for the same order already being completed — never
      // record a second charge/fulfillment for an order that's already been paid.
      const siblingCompleted = await manager.findOne(Payment, {
        where: { orderId: payment.orderId, status: PaymentEntityStatus.COMPLETED },
      });
      if (siblingCompleted) {
        await manager.update(Payment, payment.id, { status: PaymentEntityStatus.FAILED });
        return true;
      }

      await manager.update(Payment, payment.id, {
        status: PaymentEntityStatus.COMPLETED,
        gatewayPaymentId: dto.gatewayPaymentId ?? payment.gatewayPaymentId,
      });
      return false;
    });

    if (alreadyCompleted) {
      throw new BadRequestException('This order has already been paid via a different payment');
    }

    const payment = await this.findOne(dto.paymentId);

    await this.txRepo.save(this.txRepo.create({
      paymentId: payment.id,
      type: TransactionType.CHARGE,
      amount: payment.amount,
      status: TransactionStatus.SUCCEEDED,
    }));

    await this.ordersService.updatePaymentStatus(payment.orderId, OrderPaymentStatus.PAID);

    return this.findOne(payment.id);
  }

  async refund(dto: RefundPaymentDto): Promise<Payment> {
    const payment = await this.findOne(dto.paymentId);
    if (payment.status !== PaymentEntityStatus.COMPLETED) throw new BadRequestException('Can only refund completed payments');

    const refundAmount = dto.amount ?? payment.amount;
    const alreadyRefunded = Number(payment.refundedAmount ?? 0);
    const remaining = Number(payment.amount) - alreadyRefunded;

    if (refundAmount > remaining) throw new BadRequestException('Refund amount exceeds remaining balance');

    if (payment.method === PaymentMethod.STRIPE && payment.gatewayPaymentId && this.stripe) {
      const stripe = this.stripe as Record<string, unknown>;
      try {
        await (stripe.refunds as { create: (opts: Record<string, unknown>) => Promise<unknown> }).create({
          payment_intent: payment.gatewayPaymentId,
          amount: Math.round(refundAmount * 100),
          reason: dto.reason as never ?? 'requested_by_customer',
        });
      } catch {
        throw new BadRequestException('Stripe refund failed');
      }
    }

    const newRefunded = alreadyRefunded + refundAmount;
    const newStatus = newRefunded >= Number(payment.amount) ? PaymentEntityStatus.REFUNDED : PaymentEntityStatus.PARTIALLY_REFUNDED;

    await this.repo.update(payment.id, { refundedAmount: newRefunded, status: newStatus });

    await this.txRepo.save(this.txRepo.create({
      paymentId: payment.id,
      type: newStatus === PaymentEntityStatus.REFUNDED ? TransactionType.REFUND : TransactionType.PARTIAL_REFUND,
      amount: refundAmount,
      status: TransactionStatus.SUCCEEDED,
    }));

    const orderStatus = newStatus === PaymentEntityStatus.REFUNDED ? OrderPaymentStatus.REFUNDED : OrderPaymentStatus.PARTIALLY_REFUNDED;
    await this.ordersService.updatePaymentStatus(payment.orderId, orderStatus);

    return this.findOne(payment.id);
  }

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!this.stripe) return;
    const webhookSecret = this.config.get<string>('stripe.webhookSecret');
    if (!webhookSecret) return;

    const stripe = this.stripe as Record<string, unknown>;
    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      event = (stripe.webhooks as { constructEvent: (p: Buffer, s: string, w: string) => typeof event }).constructEvent(payload, signature, webhookSecret);
    } catch { return; }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const paymentId = (pi.metadata as Record<string, string>)?.paymentId;
      if (paymentId) {
        await this.confirm({ paymentId, gatewayPaymentId: pi.id as string }).catch(() => {});
      }
    }
  }
}



