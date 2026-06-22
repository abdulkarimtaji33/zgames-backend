import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, PurchaseOrderQueryDto, ReceiveItemsDto } from './dto/purchase-order.dto';
import { PurchaseOrderStatus } from './entities/purchase-order.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'warehouse_manager')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Get() findAll(@Query() q: PurchaseOrderQueryDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: CreatePurchaseOrderDto) { return this.svc.create(dto); }

  @Patch(':id/status/:status') @ApiOperation({ summary: 'Update purchase order status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Param('status') status: PurchaseOrderStatus) { return this.svc.updateStatus(id, status); }

  @Post(':id/receive') @ApiOperation({ summary: 'Receive items and update inventory' })
  receiveItems(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceiveItemsDto) { return this.svc.receiveItems(id, dto); }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
