import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationChannel, NotificationRecipientType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationQueryDto, UpdatePreferenceDto, NotificationType } from './dto/notification.dto';
import { buildPaginatedResult, getPaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(NotificationPreference) private readonly prefRepo: Repository<NotificationPreference>,
  ) {}

  async findAll(recipientId: string, query: NotificationQueryDto) {
    const { skip, take } = getPaginationOptions(query.page, query.limit);
    const qb = this.repo.createQueryBuilder('n')
      .where('n.recipientId = :rid', { rid: recipientId })
      .andWhere('n.channel = :ch', { ch: NotificationChannel.IN_APP })
      .skip(skip).take(take).orderBy('n.createdAt', 'DESC');
    if (query.isRead !== undefined) qb.andWhere('n.isRead = :r', { r: query.isRead });
    if (query.type) qb.andWhere('n.type = :t', { t: query.type });
    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResult(items, total, query.page ?? 1, query.limit ?? 20);
  }

  async markRead(id: string, recipientId: string) {
    await this.repo.update({ id, recipientId }, { isRead: true } as never);
  }

  async markAllRead(recipientId: string) {
    await this.repo.createQueryBuilder()
      .update(Notification)
      .set({ isRead: true } as never)
      .where('recipientId = :rid AND isRead = false', { rid: recipientId })
      .execute();
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.repo.count({ where: { recipientId, isRead: false } });
  }

  async createNotification(recipientId: string, recipientType: NotificationRecipientType, type: string, title: string, body: string, data?: Record<string, unknown>) {
    return this.repo.save(this.repo.create({ recipientId, recipientType, type, title, body, data: data ?? null, isRead: false, channel: NotificationChannel.IN_APP }));
  }

  async getPreferences(customerId: string) {
    return this.prefRepo.find({ where: { customerId } });
  }

  async updatePreference(customerId: string, channel: NotificationChannel, type: string, isEnabled: boolean) {
    const existing = await this.prefRepo.findOne({ where: { customerId, channel, type } });
    if (existing) {
      await this.prefRepo.update(existing.id, { isEnabled } as never);
      return this.prefRepo.findOne({ where: { id: existing.id } });
    }
    return this.prefRepo.save(this.prefRepo.create({ customerId, channel, type, isEnabled }));
  }
}

