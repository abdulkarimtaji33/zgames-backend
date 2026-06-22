import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPage } from './entities/cms-page.entity';
import { CreateCmsPageDto, UpdateCmsPageDto } from './dto/cms-page.dto';
import slugify from 'slugify';

@Injectable()
export class CmsPagesService {
  constructor(@InjectRepository(CmsPage) private readonly repo: Repository<CmsPage>) {}

  findAll() { return this.repo.find({ order: { title: 'ASC' } }); }
  findPublished() { return this.repo.find({ where: { isActive: true }, order: { title: 'ASC' } }); }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Page not found');
    return p;
  }

  async findBySlug(slug: string) {
    const p = await this.repo.findOne({ where: { slug, isActive: true } });
    if (!p) throw new NotFoundException('Page not found');
    return p;
  }

  async create(dto: CreateCmsPageDto) {
    const slug = slugify(dto.title, { lower: true, strict: true });
    return this.repo.save(this.repo.create({
      title: dto.title,
      slug,
      content: (dto.content ?? {}) as Record<string, unknown>,
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
      isActive: dto.isActive ?? true,
    }));
  }

  async update(id: string, dto: UpdateCmsPageDto) {
    const page = await this.findOne(id);
    if (dto.title) { page.title = dto.title; page.slug = slugify(dto.title, { lower: true, strict: true }); }
    if (dto.content !== undefined) page.content = (dto.content ?? {}) as Record<string, unknown>;
    if (dto.metaTitle !== undefined) page.metaTitle = dto.metaTitle ?? null;
    if (dto.metaDescription !== undefined) page.metaDescription = dto.metaDescription ?? null;
    if (dto.isActive !== undefined) page.isActive = dto.isActive;
    return this.repo.save(page);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
