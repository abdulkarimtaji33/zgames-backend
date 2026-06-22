import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportMessage } from './entities/support-message.entity';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, SupportMessage])],
  providers: [SupportTicketsService],
  controllers: [SupportTicketsController],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
