import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { CreateAttributeDto, UpdateAttributeDto, CreateAttributeOptionDto, UpdateAttributeOptionDto } from './dto/attribute.dto';
import slugify from 'slugify';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute) private readonly repo: Repository<Attribute>,
    @InjectRepository(AttributeOption) private readonly optionRepo: Repository<AttributeOption>,
  ) {}

  findAll() { return this.repo.find({ relations: { options: true }, order: { name: 'ASC' } }); }

  async findOne(id: string) {
    const a = await this.repo.findOne({ where: { id }, relations: { options: true } });
    if (!a) throw new NotFoundException('Attribute not found');
    return a;
  }

  async findBySlug(slug: string) {
    const a = await this.repo.findOne({ where: { slug }, relations: { options: true } });
    if (!a) throw new NotFoundException('Attribute not found');
    return a;
  }

  async create(dto: CreateAttributeDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const exists = await this.repo.findOne({ where: { slug } });
    if (exists) throw new ConflictException('Attribute already exists');
    return this.repo.save(this.repo.create({ ...dto, slug }));
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.findOne(id);
    const updates: Partial<Attribute> = { ...dto };
    if (dto.name) updates.slug = slugify(dto.name, { lower: true, strict: true });
    await this.repo.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }

  async addOption(attributeId: string, dto: CreateAttributeOptionDto) {
    await this.findOne(attributeId);
    return this.optionRepo.save(this.optionRepo.create({ ...dto, attributeId }));
  }

  async updateOption(attributeId: string, optionId: string, dto: UpdateAttributeOptionDto) {
    const opt = await this.optionRepo.findOne({ where: { id: optionId, attributeId } });
    if (!opt) throw new NotFoundException('Option not found');
    await this.optionRepo.update(optionId, dto);
    return this.optionRepo.findOne({ where: { id: optionId } });
  }

  async removeOption(attributeId: string, optionId: string) {
    const opt = await this.optionRepo.findOne({ where: { id: optionId, attributeId } });
    if (!opt) throw new NotFoundException('Option not found');
    await this.optionRepo.delete(optionId);
  }
}
