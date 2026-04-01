import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { QrConfigService } from './qr-config.service';
import { QrConfig, QrStatus } from './entities/qr-config.entity';
import { ServicesService } from '../services/services.service';

describe('QrConfigService', () => {
  let service: QrConfigService;
  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockServicesService = {
    countActive: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrConfigService,
        { provide: getRepositoryToken(QrConfig), useValue: mockRepo },
        { provide: ServicesService, useValue: mockServicesService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QrConfigService>(QrConfigService);
    jest.clearAllMocks();
  });

  describe('generateQr', () => {
    it('should throw if no active services', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: '1',
        status: QrStatus.INACTIVE,
      });
      mockServicesService.countActive.mockResolvedValue(0);

      await expect(service.generateQr()).rejects.toThrow(BadRequestException);
    });

    it('should generate QR when active services exist', async () => {
      const config = { id: '1', status: QrStatus.INACTIVE, qrUrl: null };
      mockRepo.findOne.mockResolvedValue(config);
      mockServicesService.countActive.mockResolvedValue(3);
      mockRepo.save.mockImplementation((c: QrConfig) => Promise.resolve(c));

      const result = await service.generateQr();
      expect(result.status).toBe(QrStatus.ACTIVE);
      expect(result.qrUrl).toContain('/menu');
    });
  });

  describe('updateStatus', () => {
    it('should prevent activation without active services', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: '1',
        status: QrStatus.PAUSED,
        generatedAt: new Date(),
      });
      mockServicesService.countActive.mockResolvedValue(0);

      await expect(service.updateStatus(QrStatus.ACTIVE)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
