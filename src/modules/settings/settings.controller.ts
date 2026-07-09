import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpsertSettingDto, BulkUpsertSettingsDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

export const THEME_SETTING_KEY = 'store_theme_default';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Public()
  @Get('public/theme')
  @ApiOperation({ summary: 'Get the storefront default theme (light/dark) - public' })
  async getPublicTheme() {
    const value = await this.svc.get(THEME_SETTING_KEY);
    const theme = typeof value === 'string' && (value === 'light' || value === 'dark') ? value : 'light';
    return { theme };
  }

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
