import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { TrackEventDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(@InjectRepository(AnalyticsEvent) private readonly repo: Repository<AnalyticsEvent>) {}

  async track(dto: TrackEventDto, customerId?: string, ipAddress?: string, userAgent?: string) {
    return this.repo.save(this.repo.create({
      eventName: dto.event,
      sessionId: dto.sessionId,
      data: { page: dto.page, referrer: dto.referrer, ...dto.properties } as Record<string, unknown>,
      customerId: customerId ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    }));
  }

  async getEventCounts(startDate?: string, endDate?: string) {
    const qb = this.repo.createQueryBuilder('e')
      .select('e.eventName', 'event')
      .addSelect('COUNT(e.id)', 'count')
      .groupBy('e.eventName')
      .orderBy('count', 'DESC');
    if (startDate) qb.andWhere('e.createdAt >= :s', { s: startDate });
    if (endDate) qb.andWhere('e.createdAt <= :e', { e: endDate });
    return qb.getRawMany();
  }

  async getPageViews(startDate?: string, endDate?: string) {
    const qb = this.repo.createQueryBuilder('e')
      .select('JSON_UNQUOTE(JSON_EXTRACT(e.data, "$.page"))', 'page')
      .addSelect('COUNT(e.id)', 'views')
      .where('e.eventName = :ev', { ev: 'page_view' })
      .groupBy('page')
      .orderBy('views', 'DESC')
      .limit(50);
    if (startDate) qb.andWhere('e.createdAt >= :s', { s: startDate });
    if (endDate) qb.andWhere('e.createdAt <= :e', { e: endDate });
    return qb.getRawMany();
  }
}
