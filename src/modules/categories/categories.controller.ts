import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Public() @Get('tree') @ApiOperation({ summary: 'Get full category tree' })
  getTree() { return this.svc.getTree(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Get('product-counts') @ApiOperation({ summary: 'Get product count per category' })
  getProductCounts() { return this.svc.getProductCounts(); }

  @Public() @Get('roots') @ApiOperation({ summary: 'Get root categories' })
  getRoots() { return this.svc.getRoots(); }

  @Public() @Get('by-slug/:slug') findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }
  @Public() @Get(':id/descendants') getDescendants(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getDescendants(id); }
  @Public() @Get(':id/ancestors') getAncestors(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getAncestors(id); }

  @Public()
  @Get() findAll(@Query() query: CategoryQueryDto) { return this.svc.findAll(query); }

  @Public() @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post() create(@Body() dto: CreateCategoryDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) { return this.svc.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
