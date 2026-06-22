import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  UpdateCustomerProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  ChangeCustomerPasswordDto,
  CustomerQueryDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Customer } from './entities/customer.entity';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'customer_support')
  @ApiOperation({ summary: 'List all customers (admin)' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current customer profile' })
  getMe(@CurrentUser() customer: Customer) {
    return customer;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current customer profile' })
  updateProfile(
    @CurrentUser() customer: Customer,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customersService.updateProfile(customer.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change customer password' })
  changePassword(
    @CurrentUser() customer: Customer,
    @Body() dto: ChangeCustomerPasswordDto,
  ) {
    return this.customersService.changePassword(customer.id, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get customer addresses' })
  getAddresses(@CurrentUser() customer: Customer) {
    return this.customersService.getAddresses(customer.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new address' })
  addAddress(
    @CurrentUser() customer: Customer,
    @Body() dto: CreateAddressDto,
  ) {
    return this.customersService.addAddress(customer.id, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  updateAddress(
    @CurrentUser() customer: Customer,
    @Param('id', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.customersService.updateAddress(customer.id, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  removeAddress(
    @CurrentUser() customer: Customer,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    return this.customersService.removeAddress(customer.id, addressId);
  }

  @Patch('me/addresses/:id/set-default')
  @ApiOperation({ summary: 'Set address as default' })
  setDefaultAddress(
    @CurrentUser() customer: Customer,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    return this.customersService.setDefaultAddress(customer.id, addressId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin', 'customer_support')
  @ApiOperation({ summary: 'Get customer by ID (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }
}
