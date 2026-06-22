import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.get<string>('oauth.facebookAppId') || 'dev-placeholder-app-id',
      clientSecret: config.get<string>('oauth.facebookAppSecret') || 'dev-placeholder-app-secret',
      callbackURL: `${config.get<string>('apiUrl') ?? 'http://localhost:3001/api'}/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: unknown, user: unknown) => void,
  ): Promise<void> {
    done(null, { accessToken, refreshToken, profile });
  }
}
