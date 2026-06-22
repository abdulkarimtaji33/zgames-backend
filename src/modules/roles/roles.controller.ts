import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly svc: RolesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: CreateRoleDto) { return this.svc.create(dto); }
  @Post('seed') seed() { return this.svc.seedDefaults(); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) { return this.svc.update(id, dto); }
  @Patch(':id/permissions') assignPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPermissionsDto) { return this.svc.assignPermissions(id, dto); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
