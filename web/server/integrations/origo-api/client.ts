import type { H3Event } from 'h3';
import { createAppError } from '~~/server/exceptions/app-error';
import { readSessionToken } from '~~/server/utils/session';
import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorFields } from '~~/shared/contracts/api-error';

// Laravel statuses that describe the caller's request rather than a broken upstream.
const CLIENT_ERROR_CODES: Record<number, ApiErrorCode> = {
  401: API_ERROR_CODES.unauthenticated,
  403: API_ERROR_CODES.forbidden,
  404: API_ERROR_CODES.notFound,
  413: API_ERROR_CODES.payloadTooLarge,
  422: API_ERROR_CODES.validationFailed,
  429: API_ERROR_CODES.rateLimited,
};

/** Capturing an HTML or URL source opens a real browser on the API side, which can take tens of seconds. */
export const CAPTURE_TIMEOUT_MILLISECONDS = 60_000;

export interface OrigoApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number>;
  body?: unknown;
  /** Overrides the default timeout for a call known to be slow, such as capturing a page. */
  timeout?: number;
}

interface UpstreamError {
  statusCode?: number;
  status?: number;
  data?: { errors?: Record<string, unknown> };
}

/** Laravel's field messages are replaced by a stable issue code; the field names are kept. */
/**
 * Turns Laravel's English validation messages into a short, safe reason the web can translate. Raw
 * provider text never reaches the browser; anything unrecognised becomes "invalid".
 */
export function toFieldReason(messages: unknown): string {
  const text = Array.isArray(messages) ? String(messages[0] ?? '') : String(messages ?? '');
  const reasons: [RegExp, string][] = [
    [/already been taken/i, 'taken'],
    [/password is incorrect|current password/i, 'incorrect'],
    [/must be at least/i, 'tooShort'],
    [/must not be greater than/i, 'tooLong'],
    [/must be a valid email|format is invalid/i, 'format'],
    [/is required/i, 'required'],
  ];

  return reasons.find(([pattern]) => pattern.test(text))?.[1] ?? 'invalid';
}

function toFields(errors: Record<string, unknown> | undefined): ApiErrorFields | undefined {
  if (!errors) {
    return undefined;
  }

  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, [toFieldReason(messages)]]));
}

export interface OrigoApiSettings {
  baseUrl: string;
  timeoutMilliseconds: number;
  token: string | null;
}

/**
 * Transport to the Laravel API for one visitor. Known client errors become application errors with the
 * same meaning; anything else is left to the shared normalizer, which reports it as an upstream failure.
 */
export function createOrigoApiTransport(settings: OrigoApiSettings, createFetch: (defaults: Record<string, unknown>) => unknown = $fetch.create) {
  // Typed loosely on purpose: every response is parsed with a Zod schema by its caller, and Nitro's
  // route-aware typing of `$fetch` does not apply to an external API.
  const request = createFetch({
    baseURL: `${settings.baseUrl}/api/v1`,
    timeout: settings.timeoutMilliseconds,
    retry: 0,
    headers: {
      Accept: 'application/json',
      ...(settings.token ? { Authorization: `Bearer ${settings.token}` } : {}),
    },
  }) as unknown as (path: string, options?: OrigoApiRequestOptions) => Promise<unknown>;

  return async function callOrigoApi(path: string, options: OrigoApiRequestOptions = {}): Promise<unknown> {
    try {
      return await request(path, options);
    } catch (cause) {
      const upstream = cause as UpstreamError;
      const code = CLIENT_ERROR_CODES[upstream.statusCode ?? upstream.status ?? 0];

      if (code) {
        throw createAppError(code, { cause, fields: code === API_ERROR_CODES.validationFailed ? toFields(upstream.data?.errors) : undefined });
      }

      throw cause;
    }
  };
}

/** Created per request so the visitor's own token is used. */
export function createOrigoApiClient(event: H3Event) {
  const { api } = useRuntimeConfig(event);

  return createOrigoApiTransport({ baseUrl: api.baseUrl, timeoutMilliseconds: api.timeoutMilliseconds, token: readSessionToken(event) });
}
