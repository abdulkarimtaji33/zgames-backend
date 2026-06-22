import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost, BlogPostStatus } from './entities/blog-post.entity';
import { BlogAuthor } from './entities/blog-author.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { CreateBlogPostDto, UpdateBlogPostDto, BlogQueryDto, CreateBlogAuthorDto, UpdateBlogAuthorDto, CreateBlogCategoryDto, UpdateBlogCategoryDto } from './dto/blog.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import slugify from 'slugify';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost) private readonly postRepo: Repository<BlogPost>,
    @InjectRepository(BlogAuthor) private readonly authorRepo: Repository<BlogAuthor>,
    @InjectRepository(BlogCategory) private readonly categoryRepo: Repository<BlogCategory>,
  ) {}

  async findAllPosts(query: BlogQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.postRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.category', 'cat')
      .skip(skip).take(take).orderBy('p.publishedAt', 'DESC');
    if (query.status) qb.andWhere('p.status = :s', { s: query.status });
    else qb.andWhere('p.status = :s', { s: BlogPostStatus.PUBLISHED });
    if (query.search) qb.andWhere('(p.title LIKE :q OR p.excerpt LIKE :q)', { q: `%${query.search}%` });
    if (query.categoryId) qb.andWhere('p.categoryId = :cid', { cid: query.categoryId });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 10);
  }

  async findPost(id: string) {
    const p = await this.postRepo.findOne({ where: { id }, relations: { author: true, category: true } });
    if (!p) throw new NotFoundException('Post not found');
    return p;
  }

  async findPostBySlug(slug: string) {
    const p = await this.postRepo.findOne({ where: { slug, status: BlogPostStatus.PUBLISHED }, relations: { author: true, category: true } });
    if (!p) throw new NotFoundException('Post not found');
    return p;
  }

  async createPost(dto: CreateBlogPostDto) {
    const slug = slugify(dto.title, { lower: true, strict: true });
    const post = this.postRepo.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt ?? null,
      content: (dto.content ?? {}) as Record<string, unknown>,
      featuredImage: dto.coverImage ?? null,
      status: dto.status as unknown as BlogPostStatus ?? BlogPostStatus.DRAFT,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? null,
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
      publishedAt: dto.status === BlogPostStatus.PUBLISHED ? new Date() : null,
    });
    return this.postRepo.save(post);
  }

  async updatePost(id: string, dto: UpdateBlogPostDto) {
    const post = await this.findPost(id);
    if (dto.title) post.slug = slugify(dto.title, { lower: true, strict: true });
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt ?? null;
    if (dto.content !== undefined) post.content = (dto.content ?? {}) as Record<string, unknown>;
    if (dto.coverImage !== undefined) post.featuredImage = dto.coverImage ?? null;
    if (dto.status !== undefined) post.status = dto.status as unknown as BlogPostStatus;
    if (dto.authorId !== undefined) post.authorId = dto.authorId ?? null;
    if (dto.categoryId !== undefined) post.categoryId = dto.categoryId ?? null;
    if (dto.tags !== undefined) post.tags = dto.tags ?? null;
    if (dto.metaTitle !== undefined) post.metaTitle = dto.metaTitle ?? null;
    if (dto.metaDescription !== undefined) post.metaDescription = dto.metaDescription ?? null;
    if (dto.status === BlogPostStatus.PUBLISHED && !post.publishedAt) post.publishedAt = new Date();
    return this.postRepo.save(post);
  }

  async removePost(id: string) { await this.findPost(id); await this.postRepo.softDelete(id); }

  findAllAuthors() { return this.authorRepo.find({ order: { name: 'ASC' } }); }
  async findAuthor(id: string) { const a = await this.authorRepo.findOne({ where: { id } }); if (!a) throw new NotFoundException('Author not found'); return a; }
  async createAuthor(dto: CreateBlogAuthorDto) { const slug = slugify(dto.name, { lower: true, strict: true }); return this.authorRepo.save(this.authorRepo.create({ ...dto, slug })); }
  async updateAuthor(id: string, dto: UpdateBlogAuthorDto) { await this.findAuthor(id); await this.authorRepo.update(id, dto as never); return this.findAuthor(id); }
  async removeAuthor(id: string) { await this.findAuthor(id); await this.authorRepo.softDelete(id); }

  findAllCategories() { return this.categoryRepo.find({ order: { name: 'ASC' } }); }
  async findCategory(id: string) { const c = await this.categoryRepo.findOne({ where: { id } }); if (!c) throw new NotFoundException('Category not found'); return c; }
  async createCategory(dto: CreateBlogCategoryDto) { const slug = slugify(dto.name, { lower: true, strict: true }); return this.categoryRepo.save(this.categoryRepo.create({ ...dto, slug })); }
  async updateCategory(id: string, dto: UpdateBlogCategoryDto) { await this.findCategory(id); await this.categoryRepo.update(id, dto as never); return this.findCategory(id); }
  async removeCategory(id: string) { await this.findCategory(id); await this.categoryRepo.softDelete(id); }
}
