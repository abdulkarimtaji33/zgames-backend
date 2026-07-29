import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { CreateReturnDto, UpdateReturnDto, ReturnQueryDto } from './dto/return.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly svc: ReturnsService) {}
  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Get() findAll(@Query() q: ReturnQueryDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string; roles?: Array<{ name: string } | string> }) {
    return this.svc.findOne(id, user);
  }
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateReturnDto) { return this.svc.create(user.id, dto); }
  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReturnDto) { return this.svc.update(id, dto); }
}
