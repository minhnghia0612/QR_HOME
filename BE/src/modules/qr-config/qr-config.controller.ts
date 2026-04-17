import { Controller, Get, Post, Patch, Body, UseGuards, Query } from '@nestjs/common';
import { QrConfigService } from './qr-config.service';
import { UpdateQrStatusDto } from './dto/update-qr-status.dto';
import { UpdateSettingsConfigDto } from './dto/update-settings-config.dto';
import { UpdateThemeConfigDto } from './dto/update-theme-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetAdmin } from '../../common/decorators/get-admin.decorator';
import { GetStoreId } from '../../common/decorators/get-store-id.decorator';

@Controller('qr-config')
export class QrConfigController {
  constructor(private readonly qrConfigService: QrConfigService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getConfig(@GetAdmin() admin: any, @GetStoreId() storeId?: string) {
    return this.qrConfigService.getConfig(admin.id, storeId);
  }

  /** 
   * Public endpoint to fetch full config for customer menu.
   * Handles both storeId (new) and adminId (legacy) from the single URL parameter.
   */
  @Get('public')
  async getPublicConfig(
    @Query('id') id?: string,
    @Query('storeId') storeId?: string,
    @Query('adminId') adminId?: string,
  ) {
    const targetId = id || storeId || adminId || '';
    
    // 1. Try resolving as storeId first
    try {
       const config = await this.qrConfigService.getConfig('', targetId);
       if (config && config.storeId === targetId) return config;
    } catch {
       // Ignore and try adminId
    }

    // 2. Fallback to adminId
    return this.qrConfigService.getConfig(targetId);
  }

  /** Public endpoint to check QR status */
  @Get('status')
  async getStatus(
    @Query('id') id?: string,
    @Query('storeId') storeId?: string,
    @Query('adminId') adminId?: string,
  ) {
    const targetId = id || storeId || adminId || '';
    
    let config;
    try {
       config = await this.qrConfigService.getConfig('', targetId);
       if (!config || config.storeId !== targetId) throw new Error();
    } catch {
       config = await this.qrConfigService.getConfig(targetId);
    }
    
    return { status: config.status };
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  generate(@GetAdmin() admin: any, @GetStoreId() storeId?: string) {
    return this.qrConfigService.generateQr(admin.id, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  updateSettings(
    @Body() dto: UpdateSettingsConfigDto,
    @GetAdmin() admin: any,
    @GetStoreId() storeId?: string,
  ) {
    return this.qrConfigService.updateSettingsConfig(admin.id, dto, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('theme')
  updateTheme(
    @Body() dto: UpdateThemeConfigDto,
    @GetAdmin() admin: any,
    @GetStoreId() storeId?: string,
  ) {
    return this.qrConfigService.updateThemeConfig(admin.id, dto, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('status')
  updateStatus(
    @Body() dto: UpdateQrStatusDto,
    @GetAdmin() admin: any,
    @GetStoreId() storeId?: string,
  ) {
    return this.qrConfigService.updateStatus(admin.id, dto.status, storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('download')
  getQrImage(@GetAdmin() admin: any, @GetStoreId() storeId?: string) {
    return this.qrConfigService.getQrImage(admin.id, storeId);
  }
}
