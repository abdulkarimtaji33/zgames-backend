import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, PurchaseOrderQueryDto, ReceiveItemsDto } from './dto/purchase-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryTransactionType } from '../inventory/entities/inventory-transaction.entity';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder) private readonly repo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private readonly itemRepo: Repository<PurchaseOrderItem>,
    private readonly inventoryService: InventoryService,
  ) {}

  private generateOrderNumber() {
    return `PO-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;
  }

  async findAll(query: PurchaseOrderQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .skip(skip).take(take).orderBy('po.createdAt', 'DESC');
    if (query.status) qb.andWhere('po.status = :s', { s: query.status });
    if (query.supplierId) qb.andWhere('po.supplierId = :sid', { sid: query.supplierId });
    if (query.warehouseId) qb.andWhere('po.warehouseId = :wid', { wid: query.warehouseId });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const po = await this.repo.findOne({ where: { id }, relations: { supplier: true, warehouse: true, items: true } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto) {
    const { items, ...rest } = dto;
    const po = this.repo.create({
      ...rest,
      orderNumber: this.generateOrderNumber(),
      status: PurchaseOrderStatus.DRAFT,
      total: items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
    });
    const savedPo = await this.repo.save(po);

    const orderItems = items.map((item) => this.itemRepo.create({ ...item, purchaseOrderId: savedPo.id }));
    await this.itemRepo.save(orderItems);

    return this.findOne(savedPo.id);
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    const po = await this.findOne(id);
    const validTransitions: Record<string, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.SENT, PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.SENT]: [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.CONFIRMED]: [PurchaseOrderStatus.RECEIVING, PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.RECEIVING]: [PurchaseOrderStatus.RECEIVED],
    };
    if (!validTransitions[po.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  async receiveItems(id: string, dto: ReceiveItemsDto) {
    const po = await this.findOne(id);
    if (![PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.RECEIVING].includes(po.status)) {
      throw new BadRequestException('Purchase order must be in CONFIRMED or RECEIVING status to receive items');
    }

    await this.repo.update(id, { status: PurchaseOrderStatus.RECEIVING });

    for (const [itemId, receivedQty] of Object.entries(dto.receivedItems)) {
      const item = po.items.find((i) => i.id === itemId);
      if (!item) continue;
      await this.itemRepo.update(itemId, { receivedQuantity: receivedQty });

      await this.inventoryService.adjustStock({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        warehouseId: po.warehouseId,
        quantity: receivedQty,
        type: InventoryTransactionType.PURCHASE,
        reference: po.orderNumber,
      });
    }

    const updatedItems = await this.itemRepo.find({ where: { purchaseOrderId: id } });
    const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.quantity);
    if (allReceived) await this.repo.update(id, { status: PurchaseOrderStatus.RECEIVED, receivedAt: new Date() });

    return this.findOne(id);
  }

  async remove(id: string) {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) throw new BadRequestException('Only DRAFT orders can be deleted');
    await this.repo.softDelete(id);
  }
}

