import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus, TicketPriority } from './entities/support-ticket.entity';
import { SupportMessage, SenderType } from './entities/support-message.entity';
import { CreateTicketDto, UpdateTicketDto, AddMessageDto, TicketQueryDto } from './dto/support-ticket.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';
import { ForbiddenException } from '@nestjs/common';

export interface RequestingUser {
  id: string;
  roles?: Array<{ name: string } | string>;
}

function isStaff(user?: RequestingUser): boolean {
  return Array.isArray(user?.roles) && user.roles.length > 0;
}

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

  /** `requester` is omitted for internal/staff-guarded call sites; pass it for any customer-reachable route so ownership is enforced. */
  async findOne(id: string, requester?: RequestingUser) {
    const t = await this.repo.findOne({ where: { id }, relations: { messages: true } });
    if (!t) throw new NotFoundException('Ticket not found');
    if (requester && !isStaff(requester) && t.customerId !== requester.id) {
      // 404 rather than 403 — don't confirm to a non-owner that this id exists at all.
      throw new NotFoundException('Ticket not found');
    }
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
    const ticket = await this.findOne(id);
    if (senderType === 'customer' && ticket.customerId !== senderId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
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
