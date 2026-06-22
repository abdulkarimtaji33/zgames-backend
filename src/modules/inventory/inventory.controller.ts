import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto, TransferStockDto, InventoryQueryDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'warehouse_manager')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Get() findAll(@Query() q: InventoryQueryDto) { return this.svc.findAll(q); }

  @Get('low-stock') @ApiOperation({ summary: 'Get low stock products' })
  getLowStock(@Query('threshold') threshold?: number) { return this.svc.getLowStockProducts(threshold); }

  @Get(':productId/transactions') @ApiOperation({ summary: 'Get inventory transactions for a product' })
  getTransactions(@Param('productId', ParseUUIDPipe) productId: string) { return this.svc.getTransactions(productId); }

  @Post('adjust') @ApiOperation({ summary: 'Adjust stock level' })
  adjust(@Body() dto: AdjustStockDto) { return this.svc.adjustStock(dto); }

  @Post('transfer') @ApiOperation({ summary: 'Transfer stock between warehouses' })
  transfer(@Body() dto: TransferStockDto) { return this.svc.transferStock(dto); }
}
