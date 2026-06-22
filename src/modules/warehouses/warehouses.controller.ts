import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'warehouse_manager')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly svc: WarehousesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Post() @Roles('super_admin', 'admin') create(@Body() dto: CreateWarehouseDto) { return this.svc.create(dto); }
  @Patch(':id') @Roles('super_admin', 'admin') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto) { return this.svc.update(id, dto); }
  @Patch(':id/set-default') @Roles('super_admin', 'admin') setDefault(@Param('id', ParseUUIDPipe) id: string) { return this.svc.setDefault(id); }
  @Delete(':id') @Roles('super_admin', 'admin') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
