import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LikeCardService } from './likecard.service';
import { LikeCardApiService } from './likecard-api.service';
import { MailService } from '../../mail/mail.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  GetLikeCardOrderDetailsQueryDto,
  ListLikeCardOrdersQueryDto,
  SyncCategoryDto,
  SyncPlaystationCatalogDto,
  SyncPopularCatalogsDto,
  TestPurchaseDto,
} from './dto/likecard.dto';
import { LIKECARD_TEST_PRODUCT_IDS } from './likecard-test-products';

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
    private readonly mailService: MailService,
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

  /** Syncs a single platform's catalog by category name, e.g. { "categoryName": "roblox" }. */
  @Post('sync-category')
  syncCategory(@Body() dto: SyncCategoryDto) {
    return this.likeCardService.syncCategory({ categoryName: dto.categoryName, displayLabel: dto.categoryName, skuPrefix: 'LC' }, dto.markupPercent);
  }

  /** Syncs every popular platform (PlayStation, Roblox, Steam, Xbox, Google Play, iTunes, Amazon, Nintendo eShop, Spotify, ...) in one pass. */
  @Post('sync-popular')
  syncPopular(@Body() dto: SyncPopularCatalogsDto) {
    return this.likeCardService.syncPopularCatalogs(dto.markupPercent);
  }

  @Get('sync-status')
  syncStatus() {
    return this.likeCardService.getSyncStatus();
  }

  /** The LikeCard-supplied product IDs safe to use with POST test-purchase (no real money). */
  @Get('test-product-ids')
  testProductIds() {
    return { productIds: LIKECARD_TEST_PRODUCT_IDS };
  }

  /** Sandbox order placement — restricted to LIKECARD_TEST_PRODUCT_IDS, never charges real money. */
  @Post('test-purchase')
  testPurchase(@Body() dto: TestPurchaseDto) {
    const referenceId = dto.referenceId ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return this.likeCardService.testPurchase(dto.productId, referenceId);
  }

  /**
   * Exercises the exact customer-facing delivery path (LikeCard test order → MailService.sendGiftCardDelivery)
   * but hardcoded to a fixed test inbox instead of a real customer's email — verifies the "code goes to the
   * customer's email" mechanism end-to-end without emailing anyone real.
   */
  @Post('test-purchase-with-email')
  async testPurchaseWithEmail(@Body() dto: TestPurchaseDto) {
    const referenceId = dto.referenceId ?? `test-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await this.likeCardService.testPurchase(dto.productId, referenceId);
    const testInbox = 'abdulkareemmain@gmail.com';
    const productName = result.product?.productName ?? `LikeCard product ${dto.productId}`;
    await this.mailService.sendGiftCardDelivery(testInbox, 'Test', productName, [result.code], `TEST-${referenceId}`);
    return { ...result, emailedTo: testInbox };
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
