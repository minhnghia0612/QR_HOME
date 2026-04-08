import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Admin } from './entities/admin.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { QrConfigService } from '../qr-config/qr-config.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly qrConfigService: QrConfigService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; admin: any }> {
    const existing = await this.adminRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new UnauthorizedException('Username or Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = this.adminRepo.create({
      username: dto.username,
      fullName: dto.fullName || dto.username,
      email: dto.email,
      passwordHash,
    });
    await this.adminRepo.save(admin);

    // Initialize SPA config if spaName is provided
    if (dto.spaName) {
      await this.qrConfigService.updateSettingsConfig(admin.id, {
        spaName: dto.spaName,
      });
    } else {
      // Ensure config exists even without name
      await this.qrConfigService.getConfig(admin.id);
    }

    return this.buildAuthResponse(admin);
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    admin: { id: string; username: string; fullName: string | null };
  }> {
    // Allow login with either username OR email
    const admin = await this.adminRepo.findOne({
      where: [{ username: dto.username }, { email: dto.username }],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await this.adminRepo.save(admin);

    return this.buildAuthResponse(admin);
  }

  async loginWithGoogle(input: { email: string; fullName?: string }): Promise<{
    accessToken: string;
    admin: { id: string; username: string; fullName: string | null };
  }> {
    const email = String(input.email || '')
      .trim()
      .toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google email is required');
    }

    let admin = await this.adminRepo.findOne({ where: { email } });

    if (!admin) {
      const baseUsername = this.sanitizeUsername(
        String(input.fullName || email.split('@')[0] || 'google_user'),
      );
      const username = await this.generateUniqueUsername(baseUsername);

      const passwordHash = await bcrypt.hash(
        randomBytes(24).toString('hex'),
        10,
      );

      admin = this.adminRepo.create({
        username,
        fullName: input.fullName?.trim() || username,
        email,
        passwordHash,
      });

      await this.adminRepo.save(admin);
      await this.qrConfigService.getConfig(admin.id);
    }

    admin.lastLogin = new Date();
    await this.adminRepo.save(admin);

    return this.buildAuthResponse(admin);
  }

  async getProfile(
    adminId: string,
  ): Promise<{ id: string; username: string; lastLogin: Date | null }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    return {
      id: admin.id,
      username: admin.username,
      lastLogin: admin.lastLogin,
    };
  }

  async getSessionByAdminId(adminId: string): Promise<{
    accessToken: string;
    admin: { id: string; username: string; fullName: string | null };
  }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    return this.buildAuthResponse(admin);
  }

  private buildAuthResponse(admin: Admin): {
    accessToken: string;
    admin: { id: string; username: string; fullName: string | null };
  } {
    const payload = { sub: admin.id, username: admin.username };
    return {
      accessToken: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
      },
    };
  }

  private sanitizeUsername(raw: string): string {
    const normalized = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || 'google_user';
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;

    while (await this.adminRepo.findOne({ where: { username: candidate } })) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
