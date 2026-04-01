import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Admin } from './entities/admin.entity';

describe('AuthService', () => {
  let service: AuthService;
  const mockAdminRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Admin), useValue: mockAdminRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return accessToken on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = {
        id: 'uuid-1',
        username: 'admin',
        passwordHash: hashedPassword,
        lastLogin: null,
      };

      mockAdminRepo.findOne.mockResolvedValue(admin);
      mockAdminRepo.save.mockResolvedValue({ ...admin, lastLogin: new Date() });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({
        username: 'admin',
        password: 'admin123',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.admin.username).toBe('admin');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        username: 'admin',
      });
    });

    it('should throw UnauthorizedException on invalid username', async () => {
      mockAdminRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ username: 'wrong', password: 'admin123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      mockAdminRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        username: 'admin',
        passwordHash: hashedPassword,
      });

      await expect(
        service.login({ username: 'admin', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return admin profile', async () => {
      mockAdminRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        username: 'admin',
        lastLogin: new Date(),
      });

      const result = await service.getProfile('uuid-1');
      expect(result.id).toBe('uuid-1');
      expect(result.username).toBe('admin');
    });

    it('should throw UnauthorizedException when admin not found', async () => {
      mockAdminRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
