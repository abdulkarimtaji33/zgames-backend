import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LikeCardService } from './likecard.service';
import { LikeCardApiService } from './likecard-api.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  GetLikeCardOrderDetailsQueryDto,
  ListLikeCardOrdersQueryDto,
  SyncPlaystationCatalogDto,
} from './dto/likecard.dto';

/** Staff-only: internal supplier reconciliation screens. Nothing here is ever customer-facing. */
@ApiTags('Integrations - LikeCard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/integrations/likecard')
export class LikeCardController {
  constructor(
    private readonly likeCardService: LikeCardService,
    private readonly api: LikeCardApiService,
  ) {}

  @Get('status')
  status() {
    return { configured: this.likeCardService.isConfigured(), circuitOpen: this.api.isCircuitOpen() };
  }

  @Get('balance')
  balance() {
    return this.likeCardService.checkBalance();
  }

  @Get('categories')
  categories() {
    return this.api.getCategories();
  }

  @Post('sync-playstation')
  syncPlaystation(@Body() dto: SyncPlaystationCatalogDto) {
    return this.likeCardService.syncPlaystationCatalog(dto.markupPercent);
  }

  @Get('sync-status')
  syncStatus() {
    return this.likeCardService.getSyncStatus();
  }

  @Get('orders')
  listOrders(@Query() query: ListLikeCardOrdersQueryDto) {
    return this.api.listOrders(query);
  }

  @Get('orders/details')
  orderDetails(@Query() query: GetLikeCardOrderDetailsQueryDto) {
    return this.api.getOrderDetails(query);
  }
}
