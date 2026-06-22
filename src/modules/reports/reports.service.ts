import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { ReportFilterDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Inventory) private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  async getRevenueSummary(filter: ReportFilterDto) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'revenue')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('AVG(o.totalAmount)', 'aov')
      .where('o.paymentStatus = :ps', { ps: 'paid' });
    if (filter.startDate) qb.andWhere('o.createdAt >= :s', { s: filter.startDate });
    if (filter.endDate) qb.andWhere('o.createdAt <= :e', { e: filter.endDate });
    return qb.getRawOne();
  }

  async getRevenueByPeriod(filter: ReportFilterDto) {
    const groupExpr = filter.groupBy === 'month' ? 'DATE_FORMAT(o.createdAt, "%Y-%m")' : filter.groupBy === 'week' ? 'YEARWEEK(o.createdAt)' : 'DATE(o.createdAt)';
    const qb = this.orderRepo.createQueryBuilder('o')
      .select(groupExpr, 'period')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .addSelect('COUNT(o.id)', 'orders')
      .where('o.paymentStatus = :ps', { ps: 'paid' })
      .groupBy('period').orderBy('period', 'ASC');
    if (filter.startDate) qb.andWhere('o.createdAt >= :s', { s: filter.startDate });
    if (filter.endDate) qb.andWhere('o.createdAt <= :e', { e: filter.endDate });
    return qb.getRawMany();
  }

  async getOrdersByStatus(filter: ReportFilterDto) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.status');
    if (filter.startDate) qb.andWhere('o.createdAt >= :s', { s: filter.startDate });
    if (filter.endDate) qb.andWhere('o.createdAt <= :e', { e: filter.endDate });
    return qb.getRawMany();
  }

  async getTopProducts(filter: ReportFilterDto) {
    return this.productRepo.createQueryBuilder('p')
      .select('p.id', 'id').addSelect('p.name', 'name').addSelect('p.slug', 'slug')
      .addSelect('p.totalSales', 'totalSales').addSelect('p.rating', 'rating')
      .orderBy('p.totalSales', 'DESC').limit(filter.limit ?? 10).getRawMany();
  }

  async getCustomerStats(filter: ReportFilterDto) {
    const total = await this.customerRepo.count();
    const qb = this.customerRepo.createQueryBuilder('c').select('COUNT(c.id)', 'newCustomers');
    if (filter.startDate) qb.andWhere('c.createdAt >= :s', { s: filter.startDate });
    if (filter.endDate) qb.andWhere('c.createdAt <= :e', { e: filter.endDate });
    const { newCustomers } = await qb.getRawOne() as { newCustomers: number };
    return { total, newCustomers: Number(newCustomers) };
  }

  async getLowStockProducts(threshold = 10) {
    return this.inventoryRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.product', 'p').leftJoinAndSelect('inv.warehouse', 'w')
      .where('inv.quantity <= :t', { t: threshold })
      .orderBy('inv.quantity', 'ASC').getMany();
  }
}
