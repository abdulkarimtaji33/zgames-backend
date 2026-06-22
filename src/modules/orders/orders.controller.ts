import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';
import { PaymentStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AddShipmentDto {
  @ApiPropertyOptional() carrier: string;
  @ApiPropertyOptional() trackingNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trackingUrl?: string;
}

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get('my') @ApiOperation({ summary: 'Get my orders (customer)' })
  getMyOrders(@CurrentUser() user: { id: string }, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.findByCustomer(user.id, +page, +limit);
  }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support', 'finance_manager')
  @Get() findAll(@Query() q: OrderQueryDto) { return this.svc.findAll(q); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Get(':id') @ApiOperation({ summary: 'Get order by ID (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @Get('track/:orderNumber') @ApiOperation({ summary: 'Track order by number (public)' })
  track(@Param('orderNumber') orderNumber: string) { return this.svc.findByOrderNumber(orderNumber); }

  @Post() create(@Body() dto: CreateOrderDto) { return this.svc.create(dto); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id/status') updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: { id: string }) {
    return this.svc.updateStatus(id, dto, user?.id);
  }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Post(':id/shipment') addShipment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddShipmentDto) { return this.svc.addShipment(id, dto); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Get(':id/timeline') getTimeline(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getTimeline(id); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id/cancel') cancel(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason?: string) { return this.svc.cancel(id, reason); }
}
