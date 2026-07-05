import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentTracking } from './entities/shipment-tracking.entity';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { Product, ProductType } from '../products/entities/product.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { GiftCardCodesService } from '../products/gift-card-codes/gift-card-codes.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory) private readonly historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Shipment) private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentTracking) private readonly trackingRepo: Repository<ShipmentTracking>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => GiftCardCodesService)) private readonly giftCardCodesService: GiftCardCodesService,
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ZG-${ts}-${rand}`;
  }

  async findAll(query: OrderQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .skip(skip).take(take).orderBy('o.createdAt', 'DESC');
    if (query.status) qb.andWhere('o.status = :s', { s: query.status });
    if (query.paymentStatus) qb.andWhere('o.paymentStatus = :ps', { ps: query.paymentStatus });
    if (query.customerId) qb.andWhere('o.customerId = :cid', { cid: query.customerId });
    if (query.countryCode) qb.andWhere('o.countryCode = :cc', { cc: query.countryCode });
    if (query.search) qb.andWhere('(o.orderNumber LIKE :q OR customer.email LIKE :q)', { q: `%${query.search}%` });
    if (query.dateFrom) qb.andWhere('o.createdAt >= :from', { from: new Date(query.dateFrom) });
    if (query.dateTo) qb.andWhere('o.createdAt <= :to', { to: new Date(query.dateTo) });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const order = await this.repo.findOne({
      where: { id },
      relations: { customer: true, items: true, statusHistory: true, shipments: { trackingHistory: true }, payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.repo.findOne({ where: { orderNumber }, relations: { items: true, shipments: { trackingHistory: true } } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByCustomer(customerId: string, page = 1, limit = 20) {
    const { skip, take } = getPaginationOptions(page, limit);
    const [items, total] = await this.repo.findAndCount({ where: { customerId }, relations: { items: true }, order: { createdAt: 'DESC' }, skip, take });
    return buildPaginatedResult(items, total, page, limit);
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const { items, ...rest } = dto;
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const shippingAmount = dto.shippingCost ?? 0;
    const total = Math.max(0, subtotal + shippingAmount);

    const orderEntity = this.repo.create({
      orderNumber: this.generateOrderNumber(),
      customerId: dto.customerId ?? null,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal,
      shippingAmount,
      total,
      currency: dto.currencyCode ?? 'AED',
      countryCode: dto.countryCode ?? 'AE',
      shippingAddress: dto.shippingAddress as unknown as Record<string, unknown>,
      billingAddress: (dto.billingAddress as unknown as Record<string, unknown>) ?? null,
      couponCode: dto.couponCode ?? null,
      customerNotes: dto.notes ?? null,
    } as never);
    const order = await this.repo.save(orderEntity as never) as unknown as Order;

    const products = await this.productRepo.find({ where: { id: In(items.map((i) => i.productId)) } });
    const productById = new Map(products.map((p) => [p.id, p]));

    const orderItems = items.map((item) => {
      const product = productById.get(item.productId);
      return this.itemRepo.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        productSnapshot: product
          ? { name: product.name, sku: product.sku, type: product.type, slug: product.slug }
          : ({} as Record<string, unknown>),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        fulfillmentStatus: product?.type === ProductType.GIFT_CARD ? 'pending' : 'not_applicable',
      });
    });
    await this.itemRepo.save(orderItems);

    await this.historyRepo.save(this.historyRepo.create({ orderId: order.id, status: OrderStatus.PENDING, note: 'Order placed', isCustomerVisible: true }));

    const fullOrder = await this.findOne(order.id);

    // Cash-on-delivery orders are confirmed immediately (no payment webhook will ever fire for them).
    if ((dto.paymentMethod ?? '').toLowerCase() === 'cod') {
      this.notifyNewOrder(fullOrder).catch((err) => this.logger.error(`Failed to send new-order notifications: ${err}`));
    }

    return fullOrder;
  }

  /** Sends the customer order-confirmation email, an admin alert email, and an in-app admin notification. */
  private async notifyNewOrder(order: Order): Promise<void> {
    const items = (order.items ?? []).map((i) => ({
      name: (i.productSnapshot as { name?: string })?.name ?? 'Item',
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    }));

    if (order.customer?.email) {
      await this.mailService.sendOrderConfirmation(
        order.customer.email,
        order.customer.firstName,
        order.orderNumber,
        Number(order.total),
        order.currency,
      ).catch(() => {});
    }

    const adminEmail = (await this.settingsService.getTyped<string>('admin_notification_email')) || process.env.ADMIN_NOTIFICATION_EMAIL;
    const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest';
    const customerEmail = order.customer?.email ?? 'N/A';

    if (adminEmail) {
      await this.mailService.sendNewOrderAdminAlert(
        adminEmail,
        order.orderNumber,
        customerName,
        customerEmail,
        Number(order.total),
        order.currency,
        items,
      ).catch(() => {});
    }

    try {
      const admins = await this.usersService.findAdmins();
      await Promise.all(admins.map((admin) =>
        this.notificationsService.createNotification(
          admin.id,
          NotificationRecipientType.USER,
          'new_order',
          `New order #${order.orderNumber}`,
          `${customerName} placed an order for ${order.currency} ${Number(order.total).toFixed(2)}`,
          { orderId: order.id },
        ),
      ));
    } catch (err) {
      this.logger.error(`Failed to create admin in-app notifications: ${err}`);
    }
  }

  /** Assigns real redemption codes (from local inventory or a configured supplier API) for each gift_card-type
   * item in a paid order, and emails them to the customer. Flags items as 'pending' for admin follow-up if stock
   * runs short. */
  private async fulfillGiftCards(order: Order): Promise<void> {
    const giftItems = (order.items ?? []).filter((i) => (i.productSnapshot as { type?: string })?.type === ProductType.GIFT_CARD);
    if (giftItems.length === 0) return;

    const recipientEmail = order.customer?.email;
    const recipientName = order.customer?.firstName ?? 'there';

    for (const item of giftItems) {
      try {
        const { codes, shortfall } = await this.giftCardCodesService.assignCodesForOrderItem({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          orderId: order.id,
          orderItemId: item.id,
          customerId: order.customerId ?? null,
        });

        await this.itemRepo.update(item.id, {
          deliveredCodes: codes.length ? codes : null,
          fulfillmentStatus: shortfall > 0 ? (codes.length ? 'partial' : 'pending') : 'fulfilled',
        });

        const productName = (item.productSnapshot as { name?: string })?.name ?? 'Gift Card';

        if (codes.length && recipientEmail) {
          await this.mailService.sendGiftCardDelivery(recipientEmail, recipientName, productName, codes, order.orderNumber).catch(() => {});
        }

        if (shortfall > 0) {
          this.logger.warn(`Gift card fulfillment shortfall of ${shortfall} for order ${order.orderNumber}, item ${item.id}`);
          const adminEmail = (await this.settingsService.getTyped<string>('admin_notification_email')) || process.env.ADMIN_NOTIFICATION_EMAIL;
          if (adminEmail) {
            await this.mailService.sendGiftCardShortfallAlert(adminEmail, order.orderNumber, productName, shortfall).catch(() => {});
          }
          const admins = await this.usersService.findAdmins();
          await Promise.all(admins.map((admin) =>
            this.notificationsService.createNotification(
              admin.id,
              NotificationRecipientType.USER,
              'gift_card_shortfall',
              `Gift card stock needed — order #${order.orderNumber}`,
              `${shortfall} more code(s) needed for "${productName}". Please fulfill manually.`,
              { orderId: order.id, orderItemId: item.id },
            ),
          ));
        }
      } catch (err) {
        this.logger.error(`Failed to fulfill gift card codes for order ${order.orderNumber}: ${err}`);
      }
    }
  }

  /** Lets an admin manually assign a redemption code to an order item stuck pending fulfillment. */
  async manuallyFulfillItem(orderId: string, itemId: string, code: string) {
    const order = await this.findOne(orderId);
    const item = (order.items ?? []).find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Order item not found');

    await this.giftCardCodesService.manuallyAssignCode({
      productId: item.productId,
      variantId: item.variantId,
      orderId: order.id,
      orderItemId: item.id,
      customerId: order.customerId ?? null,
      code,
    });

    const existingCodes = item.deliveredCodes ?? [];
    const updatedCodes = [...existingCodes, code.trim()];
    const isComplete = updatedCodes.length >= item.quantity;
    await this.itemRepo.update(item.id, {
      deliveredCodes: updatedCodes,
      fulfillmentStatus: isComplete ? 'fulfilled' : 'partial',
    });

    const productName = (item.productSnapshot as { name?: string })?.name ?? 'Gift Card';
    if (order.customer?.email) {
      await this.mailService.sendGiftCardDelivery(order.customer.email, order.customer.firstName, productName, [code.trim()], order.orderNumber).catch(() => {});
    }

    return this.findOne(orderId);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, changedBy?: string) {
    const order = await this.findOne(id);
    const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
    };
    if (allowedTransitions[order.status] && !allowedTransitions[order.status]!.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }
    await this.repo.update(id, { status: dto.status });
    await this.historyRepo.save(this.historyRepo.create({ orderId: id, status: dto.status, note: dto.notes ?? null, createdBy: changedBy ?? null }));

    if (dto.status === OrderStatus.SHIPPED && order.customer?.email) {
      await this.mailService.sendShippingUpdate(order.customer.email, order.customer.firstName, order.orderNumber, 'N/A', 'Carrier').catch(() => {});
    }

    return this.findOne(id);
  }

  async updatePaymentStatus(id: string, status: PaymentStatus) {
    await this.repo.update(id, { paymentStatus: status });
    const order = await this.findOne(id);

    if (status === PaymentStatus.PAID) {
      this.notifyNewOrder(order).catch((err) => this.logger.error(`Failed to send new-order notifications: ${err}`));
      this.fulfillGiftCards(order).catch((err) => this.logger.error(`Failed to fulfill gift cards: ${err}`));
    }

    return order;
  }

  async addShipment(orderId: string, data: { carrier: string; trackingNumber: string; trackingUrl?: string }) {
    const shipment = await this.shipmentRepo.save(this.shipmentRepo.create({ ...data, orderId }));
    await this.trackingRepo.save(this.trackingRepo.create({ shipmentId: shipment.id, status: 'shipped', description: 'Package shipped', timestamp: new Date() }));
    await this.repo.update(orderId, { status: OrderStatus.SHIPPED });
    await this.historyRepo.save(this.historyRepo.create({ orderId, status: OrderStatus.SHIPPED, note: `Tracking: ${data.trackingNumber}`, createdBy: null }));
    return this.findOne(orderId);
  }

  async addTrackingEvent(shipmentId: string, data: { status: string; description: string; location?: string }) {
    return this.trackingRepo.save(this.trackingRepo.create({ shipmentId, status: data.status, description: data.description, location: data.location ?? null, timestamp: new Date() }));
  }

  async cancel(id: string, reason?: string) {
    return this.updateStatus(id, { status: OrderStatus.CANCELLED, notes: reason ?? 'Cancelled' });
  }

  async getTimeline(id: string) {
    await this.findOne(id);
    return this.historyRepo.find({ where: { orderId: id }, order: { createdAt: 'DESC' } });
  }
}
