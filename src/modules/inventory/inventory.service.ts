import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { StockReservation, ReservationStatus } from './entities/stock-reservation.entity';
import { AdjustStockDto, TransferStockDto, InventoryQueryDto } from './dto/inventory.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private readonly repo: Repository<Inventory>,
    @InjectRepository(InventoryTransaction) private readonly txRepo: Repository<InventoryTransaction>,
    @InjectRepository(StockReservation) private readonly reservationRepo: Repository<StockReservation>,
  ) {}

  async findAll(query: InventoryQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('inv.variant', 'variant')
      .leftJoinAndSelect('inv.warehouse', 'warehouse')
      .skip(skip).take(take);
    if (query.productId) qb.andWhere('inv.productId = :pid', { pid: query.productId });
    if (query.warehouseId) qb.andWhere('inv.warehouseId = :wid', { wid: query.warehouseId });
    if (query.lowStock) qb.andWhere('inv.quantity - inv.reservedQuantity <= 5').andWhere('inv.quantity > 0');
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 50);
  }

  async getStock(productId: string, variantId?: string, warehouseId?: string): Promise<Inventory | null> {
    const where: Record<string, unknown> = { productId };
    if (variantId) where.variantId = variantId;
    if (warehouseId) where.warehouseId = warehouseId;
    return this.repo.findOne({ where: where as never });
  }

  async adjustStock(dto: AdjustStockDto): Promise<Inventory> {
    let inv = await this.getStock(dto.productId, dto.variantId, dto.warehouseId);

    if (!inv) {
      inv = this.repo.create({ productId: dto.productId, variantId: dto.variantId ?? null, warehouseId: dto.warehouseId, quantity: 0, reservedQuantity: 0 });
      inv = await this.repo.save(inv);
    }

    const quantityBefore = inv.quantity;
    const isDecrease = [InventoryTransactionType.SALE, InventoryTransactionType.TRANSFER_OUT, InventoryTransactionType.DAMAGE].includes(dto.type);
    const change = isDecrease ? -Math.abs(dto.quantity) : Math.abs(dto.quantity);
    if (isDecrease && inv.quantity + change < 0) throw new BadRequestException('Insufficient stock');
    inv.quantity += change;
    await this.repo.save(inv);

    await this.txRepo.save(this.txRepo.create({
      productId: dto.productId,
      variantId: dto.variantId ?? null,
      warehouseId: dto.warehouseId,
      type: dto.type,
      quantity: Math.abs(dto.quantity),
      quantityBefore,
      quantityAfter: inv.quantity,
      referenceId: dto.reference ?? null,
      note: dto.notes ?? null,
    }));

    return inv;
  }

  async transferStock(dto: TransferStockDto) {
    await this.adjustStock({ productId: dto.productId, variantId: dto.variantId, warehouseId: dto.fromWarehouseId, quantity: dto.quantity, type: InventoryTransactionType.TRANSFER_OUT, notes: dto.notes });
    await this.adjustStock({ productId: dto.productId, variantId: dto.variantId, warehouseId: dto.toWarehouseId, quantity: dto.quantity, type: InventoryTransactionType.TRANSFER_IN, notes: dto.notes });
    return { message: 'Transfer completed' };
  }

  async reserveStock(productId: string, variantId: string | null, warehouseId: string, quantity: number, orderId: string): Promise<StockReservation> {
    const inv = await this.getStock(productId, variantId ?? undefined, warehouseId);
    if (!inv) throw new NotFoundException('Inventory record not found');
    const available = inv.quantity - inv.reservedQuantity;
    if (available < quantity) throw new BadRequestException('Insufficient available stock');
    inv.reservedQuantity += quantity;
    await this.repo.save(inv);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    return this.reservationRepo.save(this.reservationRepo.create({ productId, variantId: variantId ?? null, warehouseId, orderId, quantity, expiresAt, status: ReservationStatus.ACTIVE }));
  }

  async releaseReservation(orderId: string) {
    const reservations = await this.reservationRepo.find({ where: { orderId, status: ReservationStatus.ACTIVE } });
    for (const res of reservations) {
      const inv = await this.getStock(res.productId, res.variantId ?? undefined, res.warehouseId);
      if (inv) { inv.reservedQuantity = Math.max(0, inv.reservedQuantity - res.quantity); await this.repo.save(inv); }
      await this.reservationRepo.update(res.id, { status: ReservationStatus.RELEASED });
    }
  }

  async fulfillReservation(orderId: string) {
    const reservations = await this.reservationRepo.find({ where: { orderId, status: ReservationStatus.ACTIVE } });
    for (const res of reservations) {
      const inv = await this.getStock(res.productId, res.variantId ?? undefined, res.warehouseId);
      if (inv) { inv.reservedQuantity = Math.max(0, inv.reservedQuantity - res.quantity); inv.quantity = Math.max(0, inv.quantity - res.quantity); await this.repo.save(inv); }
      await this.reservationRepo.update(res.id, { status: ReservationStatus.FULFILLED });
    }
  }

  async getTransactions(productId: string) {
    return this.txRepo.find({ where: { productId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  async getLowStockProducts(threshold = 5) {
    return this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('inv.warehouse', 'warehouse')
      .where('inv.quantity - inv.reservedQuantity <= :threshold', { threshold })
      .andWhere('inv.quantity > 0')
      .getMany();
  }
}
