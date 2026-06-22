import { Controller, Get, Post, Patch, Param, Query, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto, UpdatePreferenceDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}
  @Get() findAll(@CurrentUser() u: { id: string }, @Query() q: NotificationQueryDto) { return this.svc.findAll(u.id, q); }
  @Get('unread-count') getCount(@CurrentUser() u: { id: string }) { return this.svc.getUnreadCount(u.id).then((count) => ({ count })); }
  @Patch('read-all') markAllRead(@CurrentUser() u: { id: string }) { return this.svc.markAllRead(u.id); }
  @Patch(':id/read') markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: { id: string }) { return this.svc.markRead(id, u.id); }
  @Get('preferences') getPreferences(@CurrentUser() u: { id: string }) { return this.svc.getPreferences(u.id); }
}
