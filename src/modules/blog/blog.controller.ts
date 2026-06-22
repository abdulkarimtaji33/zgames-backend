import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto, BlogQueryDto, CreateBlogAuthorDto, UpdateBlogAuthorDto, CreateBlogCategoryDto, UpdateBlogCategoryDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly svc: BlogService) {}

  @Public() @Get('posts') findAll(@Query() q: BlogQueryDto) { return this.svc.findAllPosts(q); }
  @Public() @Get('posts/by-slug/:slug') findBySlug(@Param('slug') slug: string) { return this.svc.findPostBySlug(slug); }
  @Public() @Get('posts/:id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findPost(id); }
  @Public() @Get('authors') findAuthors() { return this.svc.findAllAuthors(); }
  @Public() @Get('categories') findCategories() { return this.svc.findAllCategories(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Post('posts') createPost(@Body() dto: CreateBlogPostDto) { return this.svc.createPost(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Patch('posts/:id') updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogPostDto) { return this.svc.updatePost(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete('posts/:id') @HttpCode(HttpStatus.NO_CONTENT) removePost(@Param('id', ParseUUIDPipe) id: string) { return this.svc.removePost(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Post('authors') createAuthor(@Body() dto: CreateBlogAuthorDto) { return this.svc.createAuthor(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Patch('authors/:id') updateAuthor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogAuthorDto) { return this.svc.updateAuthor(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete('authors/:id') @HttpCode(HttpStatus.NO_CONTENT) removeAuthor(@Param('id', ParseUUIDPipe) id: string) { return this.svc.removeAuthor(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Post('categories') createCategory(@Body() dto: CreateBlogCategoryDto) { return this.svc.createCategory(dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'content_editor')
  @Patch('categories/:id') updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBlogCategoryDto) { return this.svc.updateCategory(id, dto); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete('categories/:id') @HttpCode(HttpStatus.NO_CONTENT) removeCategory(@Param('id', ParseUUIDPipe) id: string) { return this.svc.removeCategory(id); }
}
