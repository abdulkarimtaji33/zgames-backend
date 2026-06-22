import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Affiliates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'marketing_manager')
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly svc: AffiliatesService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() data: Record<string, unknown>) { return this.svc.create(data); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Record<string, unknown>) { return this.svc.update(id, data); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
