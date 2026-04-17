import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { QrConfig, QrStatus } from './entities/qr-config.entity';
import { ServicesService } from '../services/services.service';
import { UpdateSettingsConfigDto } from './dto/update-settings-config.dto';
import { UpdateThemeConfigDto } from './dto/update-theme-config.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class QrConfigService {
  constructor(
    @InjectRepository(QrConfig)
    private readonly qrConfigRepo: Repository<QrConfig>,
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
    private readonly storesService: StoresService,
  ) {}

  async getConfig(adminId: string, storeId?: string): Promise<QrConfig> {
    // If storeId provided (including public endpoints), look up by storeId directly
    if (storeId) {
      let config = await this.qrConfigRepo.findOne({ where: { storeId } });

      // Security: verify ownership if adminId is present
      if (config && adminId && config.adminId !== adminId) {
        config = null; // Don't allow accessing other admin's config
      }

      if (!config && adminId) {
        config = this.qrConfigRepo.create({
          adminId,
          storeId,
          status: QrStatus.INACTIVE,
        });
        config = await this.qrConfigRepo.save(config);
      }
      return config as QrConfig;
    }

    // No storeId: resolve from admin's first store
    const stores = adminId ? await this.storesService.findAll(adminId) : [];
    const resolvedStoreId = stores[0]?.id;

    if (!resolvedStoreId) {
      // No store yet; create in-memory config without storeId
      let config = await this.qrConfigRepo.findOne({ where: { adminId } });
      if (!config) {
        config = this.qrConfigRepo.create({
          adminId,
          status: QrStatus.INACTIVE,
        });
        config = await this.qrConfigRepo.save(config);
      }
      return config;
    }

    let config = await this.qrConfigRepo.findOne({
      where: { storeId: resolvedStoreId },
    });
    if (!config) {
      config = this.qrConfigRepo.create({
        adminId,
        storeId: resolvedStoreId,
        status: QrStatus.INACTIVE,
      });
      config = await this.qrConfigRepo.save(config);
    }
    return config;
  }

  async generateQr(adminId: string, storeId?: string): Promise<QrConfig> {
    const resolvedStoreId = await this.storesService.resolveStoreId(
      adminId,
      storeId,
    );
    const activeCount = await this.servicesService.countActive(
      adminId,
      resolvedStoreId,
    );
    if (activeCount === 0) {
      throw new BadRequestException(
        'Cannot generate QR: No active services found. Please add at least one active service first.',
      );
    }

    let config = await this.getConfig(adminId, resolvedStoreId);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    // Use storeId in the QR URL so the customer menu can load the right store
    const qrUrl = `${frontendUrl}/menu/${resolvedStoreId}`;

    config.qrUrl = qrUrl;
    config.status = QrStatus.ACTIVE;
    config.generatedAt = new Date();
    config.updatedAt = new Date();

    config = await this.qrConfigRepo.save(config);
    return config;
  }

  async updateStatus(
    adminId: string,
    status: QrStatus,
    storeId?: string,
  ): Promise<QrConfig> {
    let config = await this.getConfig(adminId, storeId);

    if (!config.generatedAt && status !== QrStatus.INACTIVE) {
      throw new BadRequestException('QR has not been generated yet.');
    }

    if (status === QrStatus.ACTIVE) {
      const resolvedStoreId = storeId || config.storeId;
      const activeCount = await this.servicesService.countActive(
        adminId,
        resolvedStoreId,
      );
      if (activeCount === 0) {
        throw new BadRequestException(
          'Cannot activate QR: No active services found.',
        );
      }
    }

    config.status = status;
    config.updatedAt = new Date();
    config = await this.qrConfigRepo.save(config);
    return config;
  }

  async updateSettingsConfig(
    adminId: string,
    dto: UpdateSettingsConfigDto,
    storeId?: string,
  ): Promise<QrConfig> {
    const config = await this.getConfig(adminId, storeId);
    Object.assign(config, dto);
    config.updatedAt = new Date();

    // Sync store name if spaName is updated to keep dropdowns and banners consistent
    const effectiveStoreId = storeId || config.storeId;
    if (dto.spaName && effectiveStoreId) {
      await this.storesService.update(
        effectiveStoreId,
        { name: dto.spaName },
        adminId,
      );
    }

    return this.qrConfigRepo.save(config);
  }

  async updateThemeConfig(
    adminId: string,
    dto: UpdateThemeConfigDto,
    storeId?: string,
  ): Promise<QrConfig> {
    const config = await this.getConfig(adminId, storeId);
    Object.assign(config, dto);
    config.updatedAt = new Date();
    return this.qrConfigRepo.save(config);
  }

  async updateConfig(
    adminId: string,
    dto: UpdateSettingsConfigDto & UpdateThemeConfigDto,
    storeId?: string,
  ): Promise<QrConfig> {
    const config = await this.getConfig(adminId, storeId);
    Object.assign(config, dto);
    config.updatedAt = new Date();
    return this.qrConfigRepo.save(config);
  }

  async getQrImage(adminId: string, storeId?: string): Promise<string> {
    const config = await this.getConfig(adminId, storeId);
    if (!config.qrUrl || config.status === QrStatus.INACTIVE) {
      throw new BadRequestException('QR is not available for download.');
    }
    if (config.status === QrStatus.PAUSED) {
      throw new BadRequestException('QR is paused. Resume first to download.');
    }
    return QRCode.toDataURL(config.qrUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });
  }
}
