import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  ObjectLiteral,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  buildPaginatedResult,
  getPaginationOptions,
  PaginatedResult,
} from '../utils/pagination.util';

export abstract class CrudService<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(
    page = 1,
    limit = 20,
    options?: FindManyOptions<T>,
  ): Promise<PaginatedResult<T>> {
    const { skip, take } = getPaginationOptions(page, limit);
    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip,
      take,
    });
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, options?: FindOneOptions<T>): Promise<T> {
    const item = await this.repository.findOne({
      ...options,
      where: { id, ...((options?.where as object) ?? {}) } as never,
    });
    if (!item) throw new NotFoundException(`Record not found`);
    return item;
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity as T);
  }

  async update(id: string, dto: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    await this.repository.update(id, dto as never);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.delete(id);
  }

  async restore(id: string): Promise<T> {
    await this.repository.restore(id);
    return this.findOne(id);
  }
}
