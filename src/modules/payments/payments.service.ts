import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentEntityStatus, PaymentMethod } from './entities/payment.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { CreatePaymentIntentDto, ConfirmPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus as OrderPaymentStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private stripe: unknown;

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(PaymentTransaction) private readonly txRepo: Repository<PaymentTransaction>,
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService,
  ) {
    const stripeKey = config.get<string>('stripe.secretKey');
    if (stripeKey) {
      import('stripe').then(({ default: Stripe }) => {
        this.stripe = new Stripe(stripeKey);
      }).catch(() => {});
    }
  }

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: { transactions: true } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async createIntent(dto: CreatePaymentIntentDto): Promise<Payment> {
    const order = await this.ordersService.findOne(dto.orderId);
    const payment = await this.repo.save(this.repo.create({
      orderId: dto.orderId,
      method: dto.method,
      status: PaymentEntityStatus.PENDING,
      amount: Number(order.total),
      currency: dto.currency ?? order.currency ?? 'AED',
    }));

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
    const payment = await this.findOne(dto.paymentId);
    if (payment.status === PaymentEntityStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    await this.repo.update(payment.id, {
      status: PaymentEntityStatus.COMPLETED,
      gatewayPaymentId: dto.gatewayPaymentId ?? payment.gatewayPaymentId,
    });

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



