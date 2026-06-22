import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto, UpdateCurrencyDto, CurrencyQueryDto } from './dto/currency.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly svc: CurrenciesService) {}

  @Public() @Get('active') findActive() { return this.svc.findActive(); }
  @Public() @Get('default') getDefault() { return this.svc.getDefault(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Get() findAll(@Query() q: CurrencyQueryDto) { return this.svc.findAll(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin')
  @Post() create(@Body() dto: CreateCurrencyDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCurrencyDto) { return this.svc.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Patch(':id/set-default') @ApiOperation({ summary: 'Set default currency' })
  setDefault(@Param('id', ParseUUIDPipe) id: string) { return this.svc.setDefault(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
