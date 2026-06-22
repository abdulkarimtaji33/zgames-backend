import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { AdjustLoyaltyDto, RedeemPointsDto } from './dto/loyalty.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly svc: LoyaltyService) {}
  @Get(':customerId/history') getHistory(@Param('customerId', ParseUUIDPipe) id: string) { return this.svc.getHistory(id); }
  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'marketing_manager', 'customer_support')
  @Post('adjust') adjust(@Body() dto: AdjustLoyaltyDto) { return this.svc.adjust(dto); }
  @Post('redeem') redeem(@Body() dto: RedeemPointsDto) { return this.svc.redeem(dto); }
}
