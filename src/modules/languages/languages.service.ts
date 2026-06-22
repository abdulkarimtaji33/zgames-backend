import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './entities/language.entity';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@Injectable()
export class LanguagesService {
  constructor(@InjectRepository(Language) private readonly repo: Repository<Language>) {}

  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }
  findActive() { return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } }); }

  async getDefault() {
    const l = await this.repo.findOne({ where: { isDefault: true } });
    if (!l) throw new NotFoundException('No default language');
    return l;
  }

  async findOne(id: string) {
    const l = await this.repo.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Language not found');
    return l;
  }

  async findByCode(code: string) {
    const l = await this.repo.findOne({ where: { code } });
    if (!l) throw new NotFoundException('Language not found');
    return l;
  }

  async create(dto: CreateLanguageDto) {
    const exists = await this.repo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Language code already exists');
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateLanguageDto) {
    await this.findOne(id);
    if (dto.isDefault) await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async setDefault(id: string) {
    await this.findOne(id);
    await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, { isDefault: true });
    return this.findOne(id);
  }

  async remove(id: string) { await this.findOne(id); await this.repo.softDelete(id); }
}
