/** Base class for all LikeCard API failures, so calling code can catch broadly or narrowly. */
export class LikeCardApiError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = 'LikeCardApiError';
  }
}

/** deviceId/email/securityCode rejected by LikeCard — an account/credentials problem, not transient. */
export class LikeCardAuthError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint);
    this.name = 'LikeCardAuthError';
  }
}

/** LikeCard rejected the call because the calling server's IP is not on the account's Whitelist IPs page. */
export class LikeCardBlockedIpError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint);
    this.name = 'LikeCardBlockedIpError';
  }
}

/** create_order (and its retry/health-check policy) never reached a conclusive result. */
export class LikeCardTimeoutError extends LikeCardApiError {
  constructor(message: string, endpoint: string) {
    super(message, endpoint);
    this.name = 'LikeCardTimeoutError';
  }
}

/** LikeCard is in the post-timeout circuit-breaker state — new create_order calls are paused. */
export class LikeCardCircuitOpenError extends LikeCardApiError {
  constructor(endpoint: string) {
    super('LikeCard order creation is paused after repeated timeouts; health-check polling is in progress.', endpoint);
    this.name = 'LikeCardCircuitOpenError';
  }
}

/** A required field in LikeCard's response came back null — docs say to stop rather than proceed with partial data. */
export class LikeCardNullFieldError extends LikeCardApiError {
  constructor(field: string, endpoint: string) {
    super(`LikeCard response field "${field}" was null — aborting rather than proceeding with partial data.`, endpoint);
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
