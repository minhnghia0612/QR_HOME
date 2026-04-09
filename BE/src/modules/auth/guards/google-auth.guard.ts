import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  getAuthenticateOptions() {
    return {
      prompt: 'select_account',
    };
  }

  canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest<{
      path?: string;
      query?: Record<string, unknown>;
    }>();
    const res = http.getResponse<{ redirect: (url: string) => void }>();

    const isGoogleCallback = req.path === '/api/auth/google/callback';
    const googleError = String(req.query?.error || '').toLowerCase();
    if (isGoogleCallback && googleError === 'access_denied') {
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:5173',
      );
      res.redirect(`${frontendUrl}/?error=access_denied`);
      return false;
    }

    const clientID = this.configService
      .get<string>('GOOGLE_CLIENT_ID', '')
      .trim();
    const clientSecret = this.configService
      .get<string>('GOOGLE_CLIENT_SECRET', '')
      .trim();

    if (!clientID || !clientSecret) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured on this server',
      );
    }

    return super.canActivate(context);
  }
}
