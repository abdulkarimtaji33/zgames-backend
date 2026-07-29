import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all LikeCard API failures. Extends HttpException (rather than plain Error) so
 * the app's existing global HttpExceptionFilter maps these to their intended status code and
 * surfaces the real message, instead of collapsing every LikeCard failure into a generic 500.
 */
export class LikeCardApiError extends HttpException {
  constructor(
    message: string,
    public readonly endpoint: string,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
  ) {
    super(message, status);
    this.name = 'LikeCardApiError';
  }
}

/** deviceId/email/securityCode rejected by LikeCard — an account/credentials problem, not transient. */
export class LikeCardAuthError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint, HttpStatus.UNAUTHORIZED);
    this.name = 'LikeCardAuthError';
  }
}

/** LikeCard rejected the call because the calling server's IP is not on the account's Whitelist IPs page. */
export class LikeCardBlockedIpError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint, HttpStatus.SERVICE_UNAVAILABLE);
    this.name = 'LikeCardBlockedIpError';
  }
}

/** create_order (and its retry/health-check policy) never reached a conclusive result. */
export class LikeCardTimeoutError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint, HttpStatus.GATEWAY_TIMEOUT);
    this.name = 'LikeCardTimeoutError';
  }
}

/** LikeCard is in the post-timeout circuit-breaker state — new create_order calls are paused. */
export class LikeCardCircuitOpenError extends LikeCardApiError {
  constructor(endpoint: string) {
    super(
      'LikeCard order creation is paused after repeated timeouts; health-check polling is in progress.',
      endpoint,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.name = 'LikeCardCircuitOpenError';
  }
}

/** A required field in LikeCard's response came back null — docs say to stop rather than proceed with partial data. */
export class LikeCardNullFieldError extends LikeCardApiError {
  constructor(field: string, endpoint: string) {
    super(
      `LikeCard response field "${field}" was null — aborting rather than proceeding with partial data.`,
      endpoint,
      HttpStatus.BAD_GATEWAY,
    );
    this.name = 'LikeCardNullFieldError';
  }
}

export function classifyLikeCardFailure(message: string, endpoint: string): LikeCardApiError {
  const lower = message.toLowerCase();
  if (lower.includes('blocked ip')) return new LikeCardBlockedIpError(message, endpoint);
  if (
    lower.includes('device') ||
    lower.includes('security code') ||
    lower.includes('email') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid credentials')
  ) {
    return new LikeCardAuthError(message, endpoint);
  }
  return new LikeCardApiError(message, endpoint);
}

/**
 * Classifies a non-2xx HTTP response from LikeCard's endpoint (not a 200 with a {response:0}
 * envelope — a raw HTTP-level failure). In practice this is most often a WAF/edge block (e.g.
 * Cloudflare "Attention Required") because the calling server's IP isn't on the account's
 * Whitelist IPs page yet, which the docs describe as a "Blocked IP" condition for every endpoint.
 */
export function classifyLikeCardHttpFailure(status: number, bodySnippet: string, endpoint: string): LikeCardApiError {
  const lower = bodySnippet.toLowerCase();
  const looksBlocked =
    status === 403 ||
    status === 429 ||
    lower.includes('blocked ip') ||
    lower.includes('cloudflare') ||
    lower.includes('attention required') ||
    lower.includes('access denied');
  if (looksBlocked) {
    return new LikeCardBlockedIpError(
      `LikeCard blocked this request at the network level (HTTP ${status}) — the server's outbound IP is very likely not on LikeCard's Whitelist IPs page yet. Contact the LikeCard account manager or add it via portal.likecard.com.`,
      endpoint,
    );
  }
  if (status === 401) {
    return new LikeCardAuthError(`LikeCard rejected credentials (HTTP ${status})`, endpoint);
  }
  return new LikeCardApiError(`LikeCard ${endpoint} returned HTTP ${status}`, endpoint);
}
