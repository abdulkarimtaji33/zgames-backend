import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewQueryDto } from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Public() @Get() findAll(@Query() q: ReviewQueryDto) { return this.svc.findAll(q); }
  @Public() @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateReviewDto) { return this.svc.create(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id/approve') approve(@Param('id', ParseUUIDPipe) id: string) { return this.svc.approve(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id/reject') reject(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason?: string) { return this.svc.reject(id, reason); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Post(':id/reply') addReply(@Param('id', ParseUUIDPipe) id: string, @Body('reply') reply: string) { return this.svc.addReply(id, reply); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('super_admin', 'admin')
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
