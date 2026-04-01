import { Controller, Get, Post, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { QrConfigService } from './qr-config.service';
import { UpdateQrStatusDto } from './dto/update-qr-status.dto';
import { UpdateQrConfigDto } from './dto/update-qr-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../../common/decorators/get-admin.decorator';

@Controller('qr-config')
export class QrConfigController {
  constructor(private readonly qrConfigService: QrConfigService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getConfig(@GetAdmin() admin: any) {
    return this.qrConfigService.getConfig(admin.id);
  }

  /** Public endpoint to fetch full config for customer menu */
  @Get('public')
  async getPublicConfig(@Query('adminId') adminId: string) {
    return this.qrConfigService.getConfig(adminId);
  }

  /** Public endpoint to check QR status (used by customer site middleware) */
  @Get('status')
  async getStatus(@Query('adminId') adminId: string) {
    const config = await this.qrConfigService.getConfig(adminId);
    return { status: config.status };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  generate(@GetAdmin() admin: any) {
    return this.qrConfigService.generateQr(admin.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() dto: UpdateQrConfigDto, @GetAdmin() admin: any) {
    return this.qrConfigService.updateConfig(admin.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('status')
  updateStatus(@Body() dto: UpdateQrStatusDto, @GetAdmin() admin: any) {
    return this.qrConfigService.updateStatus(admin.id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('download')
  getQrImage(@GetAdmin() admin: any) {
    return this.qrConfigService.getQrImage(admin.id);
  }
}
