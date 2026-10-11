import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import {
  UpdateCustomerProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  ChangeCustomerPasswordDto,
  CustomerQueryDto,
} from './dto/customer.dto';
import {
  getPaginationOptions,
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/utils/pagination.util';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepo: Repository<CustomerAddress>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async findAll(query: CustomerQueryDto): Promise<PaginatedResult<Customer>> {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .skip(skip)
      .take(take);

    if (query.search) {
      qb.andWhere(
        '(customer.firstName LIKE :search OR customer.lastName LIKE :search OR customer.email LIKE :search OR customer.phone LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('customer.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.dateFrom) qb.andWhere('customer.createdAt >= :from', { from: new Date(query.dateFrom) });
    if (query.dateTo) qb.andWhere('customer.createdAt <= :to', { to: new Date(query.dateTo) });

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { email } });
  }

  async updateProfile(id: string, dto: UpdateCustomerProfileDto): Promise<Customer> {
    await this.findOne(id);
    await this.customerRepo.update(id, dto);
    return this.findOne(id);
  }

  async changePassword(id: string, dto: ChangeCustomerPasswordDto): Promise<void> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      select: { id: true, password: true } as never,
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const valid = await customer.validatePassword(dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    customer.password = dto.newPassword;
    await this.customerRepo.save(customer);
    // A refresh token issued before this change (e.g. one that leaked) must not remain valid.
    await this.refreshTokenRepo.update({ customerId: id, isRevoked: false }, { isRevoked: true });
  }

  async setActive(id: string, isActive: boolean): Promise<Customer> {
    await this.customerRepo.update(id, { isActive });
    return this.findOne(id);
  }

  async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.find({
      where: { customerId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async addAddress(customerId: string, dto: CreateAddressDto): Promise<CustomerAddress> {
    await this.findOne(customerId);

    if (dto.isDefault) {
      await this.addressRepo.update(
        { customerId },
        { isDefault: false },
      );
    }

    const address = this.addressRepo.create({ ...dto, customerId });
    return this.addressRepo.save(address);
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.addressRepo.update({ customerId }, { isDefault: false });
    }

    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async removeAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');
    await this.addressRepo.remove(address);
  }

  async setDefaultAddress(customerId: string, addressId: string): Promise<CustomerAddress> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');

    await this.addressRepo.update({ customerId }, { isDefault: false });
    address.isDefault = true;
    return this.addressRepo.save(address);
  }

  async adjustLoyaltyPoints(customerId: string, points: number): Promise<Customer> {
    const customer = await this.findOne(customerId);
    const newPoints = customer.loyaltyPoints + points;
    if (newPoints < 0) throw new BadRequestException('Insufficient loyalty points');
    await this.customerRepo.update(customerId, { loyaltyPoints: newPoints });
    return this.findOne(customerId);
  }

  async adjustStoreCredit(customerId: string, amount: number): Promise<Customer> {
    const customer = await this.findOne(customerId);
    const newCredit = Number(customer.storeCredit) + amount;
    if (newCredit < 0) throw new BadRequestException('Insufficient store credit');
    await this.customerRepo.update(customerId, { storeCredit: newCredit });
    return this.findOne(customerId);
  }
}
