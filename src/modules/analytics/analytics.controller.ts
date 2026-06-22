import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, ReportQueryDto } from './dto/analytics.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Public()
  @Post('track')
  track(@Body() dto: TrackEventDto, @Req() req: Request, @CurrentUser() user?: { id: string }) {
    return this.svc.track(dto, user?.id, req.ip, req.headers['user-agent']);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Get('events') getEvents(@Query() q: ReportQueryDto) { return this.svc.getEventCounts(q.startDate, q.endDate); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Get('page-views') getPageViews(@Query() q: ReportQueryDto) { return this.svc.getPageViews(q.startDate, q.endDate); }
}
