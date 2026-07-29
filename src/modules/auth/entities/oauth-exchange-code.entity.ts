import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * A short-lived, single-use code handed to the browser via an OAuth redirect URL, exchanged for
 * the real access/refresh tokens via a POST request. Keeps long-lived bearer credentials out of
 * the URL itself (browser history, Referer headers, reverse-proxy/CDN access logs).
 */
@Entity('oauth_exchange_codes')
export class OAuthExchangeCode extends AbstractEntity {
  @Column({ unique: true, length: 64 })
  @Index()
  code: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'int' })
  expiresIn: number;

  @Column({ type: 'datetime' })
  expiresAt: Date;
}
