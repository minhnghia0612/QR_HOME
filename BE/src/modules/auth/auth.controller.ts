import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleAuthUser } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getAuthCookieOptions() {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSiteRaw = String(
      this.configService.get<string>(
        'COOKIE_SAME_SITE',
        isProd ? 'none' : 'lax',
      ),
    ).toLowerCase();
    const sameSite: 'lax' | 'none' | 'strict' =
      sameSiteRaw === 'none' || sameSiteRaw === 'strict' ? sameSiteRaw : 'lax';

    const secureFromEnv = this.configService.get<string>('COOKIE_SECURE');
    const secure =
      typeof secureFromEnv === 'string'
        ? secureFromEnv.toLowerCase() === 'true'
        : isProd || sameSite === 'none';

    const domain = this.configService.get<string>('COOKIE_DOMAIN', '').trim();
    const maxAge = Number(
      this.configService.get<string>('COOKIE_MAX_AGE_MS', '86400000'),
    );

    return {
      httpOnly: true,
      secure,
      sameSite,
      ...(domain ? { domain } : {}),
      path: '/',
      maxAge:
        Number.isFinite(maxAge) && maxAge > 0 ? maxAge : 24 * 60 * 60 * 1000,
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.login(dto);
    res.cookie('access_token', auth.accessToken, this.getAuthCookieOptions());
    return auth;
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const auth = await this.authService.register(dto);
    res.cookie('access_token', auth.accessToken, this.getAuthCookieOptions());
    return auth;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Request() req: { user: GoogleAuthUser },
    @Res() res: Response,
  ) {
    const auth = await this.authService.loginWithGoogle(req.user);
    res.cookie('access_token', auth.accessToken, this.getAuthCookieOptions());
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    if (!req.user) {
      return res.redirect(`${frontendUrl}/auth/callback?error=access_denied`);
    }
    return res.redirect(`${frontendUrl}/auth/callback?oauth=google`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async getSession(@Request() req: { user: { id: string } }) {
    return this.authService.getSessionByAdminId(req.user.id);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = this.getAuthCookieOptions();
    const primaryClearOptions = {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
    };

    // Primary clear path matches current cookie settings.
    res.clearCookie('access_token', primaryClearOptions);

    // Backward-compatible clears for cookies set with previous env settings.
    res.clearCookie('access_token', { path: '/' });

    if (cookieOptions.domain) {
      res.clearCookie('access_token', {
        path: '/',
        domain: cookieOptions.domain,
      });
    }

    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
