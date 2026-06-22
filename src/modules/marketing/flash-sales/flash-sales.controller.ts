import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FlashSalesService } from './flash-sales.service';
import { CreateFlashSaleDto, UpdateFlashSaleDto, FlashSaleProductDto } from './dto/flash-sale.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Flash Sales')
@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly svc: FlashSalesService) {}
  @Public() @Get('active') findActive() { return this.svc.findActive(); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Get() findAll() { return this.svc.findAll(); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Post() create(@Body() dto: CreateFlashSaleDto) { return this.svc.create(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFlashSaleDto) { return this.svc.update(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Post(':id/products') addProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FlashSaleProductDto) { return this.svc.addProduct(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Delete(':id/products/:productId') @HttpCode(HttpStatus.NO_CONTENT) removeProduct(@Param('id', ParseUUIDPipe) id: string, @Param('productId', ParseUUIDPipe) pid: string) { return this.svc.removeProduct(id, pid); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
