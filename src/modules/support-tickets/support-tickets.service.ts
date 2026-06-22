import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus, TicketPriority } from './entities/support-ticket.entity';
import { SupportMessage, SenderType } from './entities/support-message.entity';
import { CreateTicketDto, UpdateTicketDto, AddMessageDto, TicketQueryDto } from './dto/support-ticket.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket) private readonly repo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage) private readonly msgRepo: Repository<SupportMessage>,
  ) {}

  async findAll(query: TicketQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('t').skip(skip).take(take).orderBy('t.createdAt', 'DESC');
    if (query.status) qb.andWhere('t.status = :s', { s: query.status });
    if (query.priority) qb.andWhere('t.priority = :p', { p: query.priority });
    if (query.customerId) qb.andWhere('t.customerId = :cid', { cid: query.customerId });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: string) {
    const t = await this.repo.findOne({ where: { id }, relations: { messages: true } });
    if (!t) throw new NotFoundException('Ticket not found');
    return t;
  }

  async create(customerId: string, dto: CreateTicketDto) {
    const ticket = await this.repo.save(this.repo.create({
      customerId,
      subject: dto.subject,
      status: TicketStatus.OPEN,
      priority: dto.priority as TicketPriority ?? TicketPriority.MEDIUM,
      orderId: dto.orderId ?? null,
    }));
    await this.msgRepo.save(this.msgRepo.create({
      ticketId: ticket.id,
      senderId: customerId,
      senderType: SenderType.CUSTOMER,
      body: dto.message,
    }));
    return this.findOne(ticket.id);
  }

  async update(id: string, dto: UpdateTicketDto, agentId?: string) {
    await this.findOne(id);
    await this.repo.update(id, {
      status: dto.status as TicketStatus | undefined,
      priority: dto.priority as TicketPriority | undefined,
      assignedTo: dto.assignedToId ?? agentId ?? undefined,
    } as never);
    return this.findOne(id);
  }

  async addMessage(id: string, senderId: string, senderType: 'customer' | 'agent', dto: AddMessageDto) {
    await this.findOne(id);
    const st = senderType === 'agent' ? SenderType.ADMIN : SenderType.CUSTOMER;
    const msg = await this.msgRepo.save(this.msgRepo.create({ ticketId: id, senderId, senderType: st, body: dto.message }));
    if (senderType === 'agent') await this.repo.update(id, { status: TicketStatus.IN_PROGRESS } as never);
    return msg;
  }

  async close(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: TicketStatus.CLOSED } as never);
    return this.findOne(id);
  }
}
