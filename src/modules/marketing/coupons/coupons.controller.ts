import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, CouponQueryDto, ValidateCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly svc: CouponsService) {}
  @Public() @Post('validate') @ApiOperation({ summary: 'Validate a coupon code' }) validate(@Body() dto: ValidateCouponDto) { return this.svc.validate(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Get() findAll(@Query() q: CouponQueryDto) { return this.svc.findAll(q); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Post() create(@Body() dto: CreateCouponDto) { return this.svc.create(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) { return this.svc.update(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
