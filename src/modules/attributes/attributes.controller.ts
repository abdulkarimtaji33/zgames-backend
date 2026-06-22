import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto, UpdateAttributeDto, CreateAttributeOptionDto, UpdateAttributeOptionDto } from './dto/attribute.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly svc: AttributesService) {}

  @Public() @Get() findAll() { return this.svc.findAll(); }
  @Public() @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post() create(@Body() dto: CreateAttributeDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAttributeDto) { return this.svc.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Post(':id/options') @ApiOperation({ summary: 'Add option to attribute' })
  addOption(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAttributeOptionDto) { return this.svc.addOption(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/options/:optionId') updateOption(@Param('id', ParseUUIDPipe) id: string, @Param('optionId', ParseUUIDPipe) optionId: string, @Body() dto: UpdateAttributeOptionDto) { return this.svc.updateOption(id, optionId, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id/options/:optionId') @HttpCode(HttpStatus.NO_CONTENT)
  removeOption(@Param('id', ParseUUIDPipe) id: string, @Param('optionId', ParseUUIDPipe) optionId: string) { return this.svc.removeOption(id, optionId); }
}
