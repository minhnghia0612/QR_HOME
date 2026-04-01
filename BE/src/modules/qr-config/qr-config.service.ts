import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { QrConfig, QrStatus } from './entities/qr-config.entity';
import { ServicesService } from '../services/services.service';
import { UpdateQrConfigDto } from './dto/update-qr-config.dto';

@Injectable()
export class QrConfigService {
  constructor(
    @InjectRepository(QrConfig)
    private readonly qrConfigRepo: Repository<QrConfig>,
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
  ) {}

  async getConfig(adminId: string): Promise<QrConfig> {
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

  async generateQr(adminId: string): Promise<QrConfig> {
    const activeCount = await this.servicesService.countActive(adminId);
    if (activeCount === 0) {
      throw new BadRequestException(
        'Cannot generate QR: No active services found. Please add at least one active service first.',
      );
    }

    let config = await this.getConfig(adminId);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const qrUrl = `${frontendUrl}/menu/${adminId}`;

    config.qrUrl = qrUrl;
    config.status = QrStatus.ACTIVE;
    config.generatedAt = new Date();
    config.updatedAt = new Date();

    config = await this.qrConfigRepo.save(config);
    return config;
  }

  async updateStatus(adminId: string, status: QrStatus): Promise<QrConfig> {
    let config = await this.getConfig(adminId);

    if (!config.generatedAt && status !== QrStatus.INACTIVE) {
      throw new BadRequestException('QR has not been generated yet.');
    }

    if (status === QrStatus.ACTIVE) {
      const activeCount = await this.servicesService.countActive(adminId);
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

  async updateConfig(adminId: string, dto: UpdateQrConfigDto): Promise<QrConfig> {
    const config = await this.getConfig(adminId);
    Object.assign(config, dto);
    config.updatedAt = new Date();
    return this.qrConfigRepo.save(config);
  }

  async getQrImage(adminId: string): Promise<string> {
    const config = await this.getConfig(adminId);
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
