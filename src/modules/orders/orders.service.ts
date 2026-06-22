import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Shipment } from './entities/shipment.entity';
import { ShipmentTracking } from './entities/shipment-tracking.entity';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory) private readonly historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Shipment) private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(ShipmentTracking) private readonly trackingRepo: Repository<ShipmentTracking>,
    private readonly mailService: MailService,
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
    const total = subtotal + shippingAmount;

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

    const orderItems = items.map((item) => this.itemRepo.create({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      productSnapshot: {} as Record<string, unknown>,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));
    await this.itemRepo.save(orderItems);

    await this.historyRepo.save(this.historyRepo.create({ orderId: order.id, status: OrderStatus.PENDING, note: 'Order placed', isCustomerVisible: true }));

    return this.findOne(order.id);
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
    return this.findOne(id);
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
