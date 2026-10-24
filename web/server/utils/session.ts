import type { H3Event } from 'h3';

// The API token never reaches browser JavaScript: it lives in an httpOnly cookie that only this server
// reads and forwards to Laravel as a bearer token.
const SESSION_COOKIE = 'origo_session';
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

export function readSessionToken(event: H3Event): string | null {
  return getCookie(event, SESSION_COOKIE) || null;
}

export function writeSessionToken(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionToken(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' });
}
