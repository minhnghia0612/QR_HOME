import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

export type GoogleAuthUser = {
  email: string;
  fullName: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID', '').trim();
    const clientSecret = configService
      .get<string>('GOOGLE_CLIENT_SECRET', '')
      .trim();
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/api/auth/google/callback',
    );
    const googleEnabled = Boolean(clientID && clientSecret);

    super({
      // Keep app bootable even when Google OAuth is not configured.
      // Guard will return 503 for Google routes in that case.
      clientID: clientID || 'disabled_google_client_id',
      clientSecret: clientSecret || 'disabled_google_client_secret',
      callbackURL,
      scope: ['email', 'profile'],
    });

    if (!googleEnabled) {
      this.logger.warn(
        'Google OAuth disabled: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is missing',
      );
    }
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google account does not expose an email'), false);
    }

    const user: GoogleAuthUser = {
      email,
      fullName: profile.displayName || email.split('@')[0] || 'Google User',
    };

    done(null, user);
  }
}
