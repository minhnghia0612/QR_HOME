import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });
    await this.adminRepo.save(admin);

    // Initialize SPA config if spaName is provided
    if (dto.spaName) {
      await this.qrConfigService.updateConfig(admin.id, {
        spaName: dto.spaName,
      });
    } else {
      // Ensure config exists even without name
      await this.qrConfigService.getConfig(admin.id);
    }

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

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    admin: { id: string; username: string; fullName: string };
  }> {
    const admin = await this.adminRepo.findOne({
      where: { username: dto.username },
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
}
