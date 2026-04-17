import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { TrafficService } from './traffic.service';
import { LogVisitDto } from './dto/log-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../../common/decorators/get-admin.decorator';
import { GetStoreId } from '../../common/decorators/get-store-id.decorator';
import { TrafficGateway } from './traffic.gateway';

@Controller('traffic')
export class TrafficController {
  constructor(
    private readonly trafficService: TrafficService,
    private readonly trafficGateway: TrafficGateway,
  ) {}

  /** Public: log a visit from customer site */
  @Post('log')
  async logVisit(@Body() dto: LogVisitDto, @Req() req: Request) {
    dto.ipAddress =
      dto.ipAddress || req.ip || req.socket.remoteAddress || undefined;
    dto.userAgent = dto.userAgent || req.headers['user-agent'] || undefined;
    const result = await this.trafficService.logVisit(dto);

    if (dto.adminId) {
      const dashboard = await this.trafficService.getDashboardSummary(dto.adminId, dto.storeId);
      this.trafficGateway.emitDashboardUpdated(dto.adminId, dashboard);
    }

    return result;
  }

  /** Admin: weekly traffic chart data */
  @UseGuards(JwtAuthGuard)
  @Get('weekly')
  getWeeklyTraffic(@GetAdmin() admin: { id: string }, @GetStoreId() storeId?: string) {
    return this.trafficService.getWeeklyTraffic(admin.id, storeId);
  }

  /** Admin: most viewed service */
  @UseGuards(JwtAuthGuard)
  @Get('most-viewed')
  getMostViewedService(@GetAdmin() admin: { id: string }, @GetStoreId() storeId?: string) {
    return this.trafficService.getMostViewedService(admin.id, storeId);
  }

  /** Public: top 5 viewed services for article slide */
  @Get('top-viewed')
  getTopViewedServices(@Query('adminId') adminId: string, @Query('storeId') storeId?: string) {
    return this.trafficService.getTopViewedServices(adminId, 5, storeId);
  }

  /** Admin: growth stats */
  @UseGuards(JwtAuthGuard)
  @Get('growth')
  getGrowth(@GetAdmin() admin: { id: string }, @GetStoreId() storeId?: string) {
    return this.trafficService.getGrowth(admin.id, storeId);
  }

  /** Admin: dashboard summary */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(@GetAdmin() admin: { id: string }, @GetStoreId() storeId?: string) {
    return this.trafficService.getDashboardSummary(admin.id, storeId);
  }
}
