import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly svc: ReferralsService) {}
  @Get('mine') getMyReferral(@CurrentUser() user: { id: string }) { return this.svc.findByReferrer(user.id); }
  @Post('generate') generateCode(@CurrentUser() user: { id: string }) { return this.svc.create(user.id); }
}
