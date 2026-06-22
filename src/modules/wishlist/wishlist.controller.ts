import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly svc: WishlistService) {}
  @Get() getWishlist(@CurrentUser() user: { id: string }) { return this.svc.getOrCreate(user.id); }
  @Post(':productId') addProduct(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) productId: string) { return this.svc.addProduct(user.id, productId); }
  @Delete(':productId') removeProduct(@CurrentUser() user: { id: string }, @Param('productId', ParseUUIDPipe) productId: string) { return this.svc.removeProduct(user.id, productId); }
  @Delete() clearWishlist(@CurrentUser() user: { id: string }) { return this.svc.clearWishlist(user.id); }
}
