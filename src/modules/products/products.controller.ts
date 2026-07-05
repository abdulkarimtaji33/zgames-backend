import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateProductVariantDto, UpdateProductVariantDto,
  AddProductImageDto, SetRelatedProductsDto, ReorderImagesDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Public() @Get() findAll(@Query() query: ProductQueryDto) { return this.svc.findAll(query); }
  @Public() @Get('by-slug/:slug') findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }
  @Public() @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Public() @Get(':id/images') getImages(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getImages(id); }
  @Public() @Get(':id/variants') getVariants(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getVariants(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post() create(@Body() dto: CreateProductDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) { return this.svc.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post(':id/variants') addVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateProductVariantDto) { return this.svc.addVariant(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/variants/:variantId') updateVariant(@Param('id', ParseUUIDPipe) id: string, @Param('variantId', ParseUUIDPipe) vid: string, @Body() dto: UpdateProductVariantDto) { return this.svc.updateVariant(id, vid, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id/variants/:variantId') @HttpCode(HttpStatus.NO_CONTENT)
  removeVariant(@Param('id', ParseUUIDPipe) id: string, @Param('variantId', ParseUUIDPipe) vid: string) { return this.svc.removeVariant(id, vid); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post(':id/images') addImage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddProductImageDto) { return this.svc.addImage(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/images/:imageId/set-primary') setPrimary(@Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) { return this.svc.setPrimaryImage(id, imageId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id/images/:imageId') @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(@Param('id', ParseUUIDPipe) id: string, @Param('imageId', ParseUUIDPipe) imageId: string) { return this.svc.removeImage(id, imageId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/images/reorder') @ApiOperation({ summary: 'Reorder product images' })
  reorderImages(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderImagesDto) { return this.svc.reorderImages(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/related') setRelated(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetRelatedProductsDto) { return this.svc.setRelated(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/upsell') setUpsell(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetRelatedProductsDto) { return this.svc.setUpsell(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/crosssell') setCrosssell(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetRelatedProductsDto) { return this.svc.setCrosssell(id, dto); }
}
