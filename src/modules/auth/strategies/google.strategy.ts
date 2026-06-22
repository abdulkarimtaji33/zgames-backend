import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  name: { givenName: string; familyName: string };
  photos: Array<{ value: string }>;
  provider: 'google';
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('oauth.googleClientId') || 'dev-placeholder-client-id',
      clientSecret: config.get<string>('oauth.googleClientSecret') || 'dev-placeholder-client-secret',
      callbackURL: `${config.get<string>('apiUrl') ?? 'http://localhost:3001/api'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    done(null, { accessToken, refreshToken, profile });
  }
}
