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
