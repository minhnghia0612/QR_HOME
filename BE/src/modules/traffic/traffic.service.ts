import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { TrafficLog } from './entities/traffic-log.entity';
import { LogVisitDto } from './dto/log-visit.dto';

interface RawTrafficRow {
  date: string;
  count: string;
}

interface RawServiceViewRow {
  serviceId: string;
  name: string;
  views: string;
}

interface RawTopViewedRow {
  serviceId: string;
  serviceName: string;
  imageUrl: string;
  view_count: string;
}

@Injectable()
export class TrafficService {
  constructor(
    @InjectRepository(TrafficLog)
    private readonly trafficLogRepo: Repository<TrafficLog>,
  ) {}

  async logVisit(dto: LogVisitDto): Promise<TrafficLog> {
    const log = this.trafficLogRepo.create({
      serviceId: dto.serviceId || null,
      adminId: dto.adminId,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
    });
    return this.trafficLogRepo.save(log);
  }

  /** Dashboard: 7-day traffic chart (page views only, service_id IS NULL) */
  async getWeeklyTraffic(adminId: string): Promise<{ date: string; count: number }[]> {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: 0 });
    }

    const sevenDaysAgo = new Date(days[0].date);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result: RawTrafficRow[] = await this.trafficLogRepo
      .createQueryBuilder('log')
      .select('DATE(log.visitedAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.adminId = :adminId', { adminId })
      .andWhere('log.serviceId IS NULL')
      .andWhere('log.visitedAt >= :since', { since: sevenDaysAgo })
      .groupBy('DATE(log.visitedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Merge real data into our 7-day template
    result.forEach((row) => {
      const dateOnly = new Date(row.date).toISOString().split('T')[0];
      const day = days.find((d) => d.date === dateOnly);
      if (day) {
        day.count = parseInt(row.count, 10);
      }
    });

    return days;
  }

  /** Dashboard: Most viewed service (top 1) */
  async getMostViewedService(adminId: string): Promise<{
    serviceId: string;
    name: string;
    views: number;
  } | null> {
    const result: RawServiceViewRow | undefined = await this.trafficLogRepo
      .createQueryBuilder('log')
      .select('log.serviceId', 'serviceId')
      .addSelect('service.name', 'name')
      .addSelect('COUNT(*)', 'views')
      .innerJoin('log.service', 'service')
      .where('log.adminId = :adminId', { adminId })
      .andWhere('log.serviceId IS NOT NULL')
      .groupBy('log.serviceId')
      .addGroupBy('service.name')
      .orderBy('views', 'DESC')
      .limit(1)
      .getRawOne();

    if (!result) return null;
    return {
      serviceId: result.serviceId,
      name: result.name,
      views: parseInt(result.views, 10),
    };
  }

  async getTopViewedServices(
    adminId: string,
    limit = 5,
  ): Promise<
    {
      serviceId: string;
      serviceName: string;
      imageUrl?: string;
      viewCount: number;
    }[]
  > {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result: RawTopViewedRow[] = await this.trafficLogRepo
      .createQueryBuilder('log')
      .select('log.serviceId', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('service.imageUrl', 'imageUrl')
      .addSelect('COUNT(*)', 'view_count')
      .innerJoin('log.service', 'service')
      .where('log.adminId = :adminId', { adminId })
      .andWhere('log.serviceId IS NOT NULL')
      .andWhere('log.visitedAt >= :since', { since: thirtyDaysAgo })
      .groupBy('log.serviceId')
      .addGroupBy('service.name')
      .addGroupBy('service.imageUrl')
      .orderBy('view_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      imageUrl: r.imageUrl,
      viewCount: parseInt(String(r.view_count), 10),
    }));
  }

  /** Dashboard: Growth calculation */
  async getGrowth(adminId: string): Promise<{
    todayViews: number;
    yesterdayViews: number;
    growthPercent: number | null;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayViews = await this.trafficLogRepo
      .createQueryBuilder('log')
      .where('log.adminId = :adminId', { adminId })
      .andWhere('log.serviceId IS NOT NULL')
      .andWhere('log.visitedAt >= :today', { today })
      .andWhere('log.visitedAt < :tomorrow', { tomorrow })
      .getCount();

    const yesterdayViews = await this.trafficLogRepo
      .createQueryBuilder('log')
      .where('log.serviceId IS NOT NULL')
      .andWhere('log.adminId = :adminId', { adminId })
      .andWhere('log.visitedAt >= :yesterday', { yesterday })
      .andWhere('log.visitedAt < :today', { today })
      .getCount();

    let growthPercent: number | null = null;
    if (yesterdayViews > 0) {
      growthPercent = ((todayViews - yesterdayViews) / yesterdayViews) * 100;
    } else if (todayViews > 0) {
      growthPercent = 100;
    }

    return { todayViews, yesterdayViews, growthPercent };
  }

  /** Dashboard: total service views */
  async getTotalServiceViews(adminId: string): Promise<number> {
    return this.trafficLogRepo.count({
      where: { serviceId: Not(IsNull()), adminId },
    });
  }

  async getTodayTotalViews(adminId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.trafficLogRepo
      .createQueryBuilder('log')
      .where('log.adminId = :adminId', { adminId })
      .andWhere('log.visitedAt >= :today', { today })
      .andWhere('log.visitedAt < :tomorrow', { tomorrow })
      .getCount();
  }

  async getDashboardSummary(adminId: string) {
    const [weekly, mostViewed, growth, totalViews, top5, todayTotalViews] = await Promise.all([
      this.getWeeklyTraffic(adminId),
      this.getMostViewedService(adminId),
      this.getGrowth(adminId),
      this.getTotalServiceViews(adminId),
      this.getTopViewedServices(adminId, 5),
      this.getTodayTotalViews(adminId),
    ]);

    return {
      weekly,
      mostViewed,
      growth,
      totalViews,
      todayServiceViews: growth.todayViews,
      todayTotalViews,
      top5,
    };
  }
}
