import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { TrafficService } from './traffic.service';
import { LogVisitDto } from './dto/log-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../../common/decorators/get-admin.decorator';

@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  /** Public: log a visit from customer site */
  @Post('log')
  logVisit(@Body() dto: LogVisitDto, @Req() req: Request) {
    dto.ipAddress =
      dto.ipAddress || req.ip || req.socket.remoteAddress || undefined;
    dto.userAgent = dto.userAgent || req.headers['user-agent'] || undefined;
    return this.trafficService.logVisit(dto);
  }

  /** Admin: weekly traffic chart data */
  @UseGuards(JwtAuthGuard)
  @Get('weekly')
  getWeeklyTraffic(@GetAdmin() admin: { id: string }) {
    return this.trafficService.getWeeklyTraffic(admin.id);
  }

  /** Admin: most viewed service */
  @UseGuards(JwtAuthGuard)
  @Get('most-viewed')
  getMostViewedService(@GetAdmin() admin: { id: string }) {
    return this.trafficService.getMostViewedService(admin.id);
  }

  /** Public: top 5 viewed services for article slide */
  @Get('top-viewed')
  getTopViewedServices(@Query('adminId') adminId: string) {
    return this.trafficService.getTopViewedServices(adminId);
  }

  /** Admin: growth stats */
  @UseGuards(JwtAuthGuard)
  @Get('growth')
  getGrowth(@GetAdmin() admin: { id: string }) {
    return this.trafficService.getGrowth(admin.id);
  }

  /** Admin: dashboard summary */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@GetAdmin() admin: { id: string }) {
    const [weekly, mostViewed, growth, totalViews] = await Promise.all([
      this.trafficService.getWeeklyTraffic(admin.id),
      this.trafficService.getMostViewedService(admin.id),
      this.trafficService.getGrowth(admin.id),
      this.trafficService.getTotalServiceViews(admin.id),
    ]);
    return { weekly, mostViewed, growth, totalViews };
  }
}
