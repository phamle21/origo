import type { H3Event } from 'h3';

export function getRequestId(event: H3Event): string {
  return event.context.requestId ?? 'unassigned';
}

/**
 * Resolves the caller address for rate limiting from the connection itself. Forwarded headers are
 * ignored because a client can set them, so behind a reverse proxy every visitor shares one address.
 */
export function getClientAddress(event: H3Event): string {
  return getRequestIP(event) ?? 'unknown';
}
