import { Controller, Get, Post, Delete, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GiftCardCodesService } from './gift-card-codes.service';
import { BulkUploadCodesDto, GiftCardSupplierConfigDto, ManualFulfillDto } from './dto/gift-card-code.dto';
import { GiftCardCodeStatus } from './entities/gift-card-code.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { OrdersService } from '../../orders/orders.service';

@ApiTags('Gift Card Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller()
export class GiftCardCodesController {
  constructor(
    private readonly svc: GiftCardCodesService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('products/:productId/gift-card-codes/bulk')
  bulkUpload(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: BulkUploadCodesDto) {
    return this.svc.bulkUpload(productId, dto.variantId, dto.codes);
  }

  @Get('products/:productId/gift-card-codes')
  list(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('variantId') variantId?: string,
    @Query('status') status?: GiftCardCodeStatus,
  ) {
    return this.svc.listByProduct(productId, variantId, status);
  }

  @Get('products/:productId/gift-card-codes/stats')
  stats(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.svc.stats(productId);
  }

  @Delete('gift-card-codes/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deleteCode(id);
  }

  @Post('products/variants/:variantId/gift-card-supplier')
  configureSupplier(@Param('variantId', ParseUUIDPipe) variantId: string, @Body() dto: GiftCardSupplierConfigDto) {
    return this.svc.configureSupplier(variantId, dto);
  }

  @Get('orders/:orderId/items/:itemId/gift-card-codes')
  listByOrderItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.svc.listByOrderItem(itemId);
  }

  @Get('gift-card-codes/low-stock')
  lowStock(@Query('threshold') threshold?: string) {
    return this.svc.lowStock(threshold ? Number(threshold) : undefined);
  }

  @Post('orders/:orderId/items/:itemId/fulfill-manual')
  fulfillManual(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ManualFulfillDto,
  ) {
    return this.ordersService.manuallyFulfillItem(orderId, itemId, dto.code);
  }
}
