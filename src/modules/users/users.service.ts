import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
  UserQueryDto,
} from './dto/user.dto';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAdmins(): Promise<User[]> {
    return this.userRepo.createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.name IN (:...names)', { names: ['super_admin', 'admin'] })
      .andWhere('user.isActive = true')
      .getMany();
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResult<User>> {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .skip(skip)
      .take(take);

    if (query.search) {
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const { roleIds, ...userData } = dto;
    const user = this.userRepo.create(userData);

    if (roleIds?.length) {
      user.roles = await this.roleRepo.findBy({ id: In(roleIds) });
    }

    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { roleIds, password, ...rest } = dto;

    Object.assign(user, rest);

    if (password) {
      user.password = password;
    }

    if (roleIds !== undefined) {
      user.roles = roleIds.length ? await this.roleRepo.findBy({ id: In(roleIds) }) : [];
    }

    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepo.softDelete(id);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.findOne(id);
    await this.userRepo.update(id, dto);
    return this.findOne(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: { id: true, password: true } as never,
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await user.validatePassword(dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.password = dto.newPassword;
    await this.userRepo.save(user);
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    await this.userRepo.update(id, { isActive });
    return this.findOne(id);
  }
}
