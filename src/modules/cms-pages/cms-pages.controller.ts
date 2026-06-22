import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CmsPagesService } from './cms-pages.service';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto/cms-page.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('CMS Pages')
@Controller('cms-pages')
export class CmsPagesController {
  constructor(private readonly svc: CmsPagesService) {}
  @Public() @Get('published') findPublished() { return this.svc.findPublished(); }
  @Public() @Get('by-slug/:slug') findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Get() findAll() { return this.svc.findAll(); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Post() create(@Body() dto: CreateCmsPageDto) { return this.svc.create(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCmsPageDto) { return this.svc.update(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
