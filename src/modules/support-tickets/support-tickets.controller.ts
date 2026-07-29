import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto, UpdateTicketDto, AddMessageDto, TicketQueryDto } from './dto/support-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly svc: SupportTicketsService) {}

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Get() findAll(@Query() q: TicketQueryDto) { return this.svc.findAll(q); }

  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string; roles?: Array<{ name: string } | string> }) {
    return this.svc.findOne(id, user);
  }

  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateTicketDto) { return this.svc.create(user.id, dto); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: { id: string }) { return this.svc.update(id, dto, user.id); }

  @Post(':id/messages') addMessage(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }, @Body() dto: AddMessageDto) { return this.svc.addMessage(id, user.id, 'customer', dto); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Post(':id/agent-reply') agentReply(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }, @Body() dto: AddMessageDto) { return this.svc.addMessage(id, user.id, 'agent', dto); }

  @UseGuards(RolesGuard) @Roles('super_admin', 'admin', 'customer_support')
  @Patch(':id/close') close(@Param('id', ParseUUIDPipe) id: string) { return this.svc.close(id); }
}
