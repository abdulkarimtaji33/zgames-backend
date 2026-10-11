import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto, UpdateCountryDto, CountryQueryDto } from './dto/country.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly svc: CountriesService) {}

  @Public() @Get('active') @ApiOperation({ summary: 'List active countries' })
  findActive() { return this.svc.findActive(); }

  @Public() @Get('cities') @ApiOperation({ summary: 'List cities for a country, grouped by state' })
  findCities(@Query('countryCode') countryCode: string) {
    return this.svc.findCitiesByCountry(countryCode ?? 'AE');
  }

  @Public() @Get(':code/by-code') @ApiOperation({ summary: 'Get country by code' })
  findByCode(@Param('code') code: string) { return this.svc.findByCode(code); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Get() @ApiOperation({ summary: 'List all countries (admin)' })
  findAll(@Query() query: CountryQueryDto) { return this.svc.findAll(query); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Post() create(@Body() dto: CreateCountryDto) { return this.svc.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCountryDto) { return this.svc.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
