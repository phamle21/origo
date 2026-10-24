export const API_ERROR_CODES = {
  validationFailed: 'VALIDATION_FAILED',
  unauthenticated: 'UNAUTHENTICATED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  conflict: 'CONFLICT',
  unprocessable: 'UNPROCESSABLE',
  payloadTooLarge: 'PAYLOAD_TOO_LARGE',
  rateLimited: 'RATE_LIMITED',
  internalError: 'INTERNAL_ERROR',
  upstreamInvalidResponse: 'UPSTREAM_INVALID_RESPONSE',
  upstreamTimeout: 'UPSTREAM_TIMEOUT',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/** Application-owned field names mapped to their issue codes. Provider field names never appear here. */
export type ApiErrorFields = Record<string, string[]>;

export interface ApiErrorData {
  code: ApiErrorCode;
  /** Stable client-safe text. Displayed copy is resolved from `code` through i18n, not from this value. */
  message: string;
  requestId: string;
  fields?: ApiErrorFields;
  retryAfterSeconds?: number;
}
