import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpsertSettingDto, BulkUpsertSettingsDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get() @Roles('super_admin', 'admin') findAll() { return this.svc.findAll(); }

  @Get('group/:group') @Roles('super_admin', 'admin')
  findByGroup(@Param('group') group: string) { return this.svc.findByGroup(group); }

  @Post() @Roles('super_admin', 'admin')
  upsert(@Body() dto: UpsertSettingDto) { return this.svc.upsert(dto); }

  @Post('bulk') @Roles('super_admin', 'admin')
  bulkUpsert(@Body() dto: BulkUpsertSettingsDto) { return this.svc.bulkUpsert(dto); }

  @Delete(':key') @Roles('super_admin')
  remove(@Param('key') key: string) { return this.svc.remove(key); }
}
