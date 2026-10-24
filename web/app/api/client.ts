import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorData } from '~~/shared/contracts/api-error';

export type ApiClient = ReturnType<typeof $fetch.create>;

const API_ERROR_MESSAGE_KEYS: Record<ApiErrorCode, string> = {
  [API_ERROR_CODES.validationFailed]: 'errors.validationFailed',
  [API_ERROR_CODES.unauthenticated]: 'errors.unauthenticated',
  [API_ERROR_CODES.forbidden]: 'errors.forbidden',
  [API_ERROR_CODES.notFound]: 'errors.notFound',
  [API_ERROR_CODES.conflict]: 'errors.conflict',
  [API_ERROR_CODES.unprocessable]: 'errors.unprocessable',
  [API_ERROR_CODES.payloadTooLarge]: 'errors.payloadTooLarge',
  [API_ERROR_CODES.rateLimited]: 'errors.rateLimited',
  [API_ERROR_CODES.internalError]: 'errors.internalError',
  [API_ERROR_CODES.upstreamInvalidResponse]: 'errors.upstreamInvalidResponse',
  [API_ERROR_CODES.upstreamTimeout]: 'errors.upstreamTimeout',
};

const UNKNOWN_ERROR_MESSAGE_KEY = 'errors.unknown';

/**
 * Transport for this application's own Nitro endpoints. Domain files under `app/api/<domain>/` own the
 * paths and payload types; nothing else in `app/` calls `$fetch` for an application API.
 */
export function useApiClient(): ApiClient {
  return useNuxtApp().$apiFetch as ApiClient;
}

function isApiErrorData(value: unknown): value is ApiErrorData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ApiErrorData>;

  return (
    typeof candidate.code === 'string' &&
    candidate.code in API_ERROR_MESSAGE_KEYS &&
    typeof candidate.message === 'string' &&
    typeof candidate.requestId === 'string'
  );
}

/**
 * Extracts the application error contract from a rejected request. A failure that did not come from
 * this application's Nitro boundary, such as a network drop, resolves to null.
 */
export function toApiErrorData(error: unknown): ApiErrorData | null {
  if (isApiErrorData(error)) {
    return error;
  }
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const body = (error as { data?: unknown }).data;

  if (isApiErrorData(body)) {
    return body;
  }

  // h3 nests the handler payload under the error response body.
  const nested = typeof body === 'object' && body !== null ? (body as { data?: unknown }).data : undefined;

  return isApiErrorData(nested) ? nested : null;
}

export function getApiErrorMessageKey(error: ApiErrorData | null): string {
  return error ? API_ERROR_MESSAGE_KEYS[error.code] : UNKNOWN_ERROR_MESSAGE_KEY;
}
