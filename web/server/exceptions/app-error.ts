import { type ApiErrorCode, type ApiErrorData, type ApiErrorFields } from '~~/shared/contracts/api-error';
import type { ErrorSeverity } from '~~/shared/types/severity';

interface AppErrorOptions {
  code: ApiErrorCode;
  statusCode: number;
  /** Stable client-safe text. Never carries provider text, identifiers, or personal data. */
  publicMessage: string;
  /** Diagnostic text kept on the server; defaults to `publicMessage`. */
  internalMessage?: string;
  severity?: ErrorSeverity;
  cause?: unknown;
  fields?: ApiErrorFields;
  retryAfterSeconds?: number;
}

export type CreateAppErrorOptions = Omit<AppErrorOptions, 'code' | 'statusCode' | 'publicMessage'> & {
  publicMessage?: string;
};

const API_ERROR_DEFAULTS: Record<ApiErrorCode, { statusCode: number; publicMessage: string }> = {
  VALIDATION_FAILED: { statusCode: 400, publicMessage: 'The request contains invalid input.' },
  UNAUTHENTICATED: { statusCode: 401, publicMessage: 'Authentication is required.' },
  FORBIDDEN: { statusCode: 403, publicMessage: 'This action is not allowed.' },
  NOT_FOUND: { statusCode: 404, publicMessage: 'The requested resource does not exist.' },
  CONFLICT: { statusCode: 409, publicMessage: 'The request conflicts with the current state.' },
  UNPROCESSABLE: { statusCode: 422, publicMessage: 'The request could not be processed.' },
  PAYLOAD_TOO_LARGE: { statusCode: 413, publicMessage: 'The request payload is too large.' },
  RATE_LIMITED: { statusCode: 429, publicMessage: 'Too many requests.' },
  INTERNAL_ERROR: { statusCode: 500, publicMessage: 'An unexpected error occurred.' },
  UPSTREAM_INVALID_RESPONSE: { statusCode: 502, publicMessage: 'An upstream service returned an invalid response.' },
  UPSTREAM_TIMEOUT: { statusCode: 504, publicMessage: 'An upstream service did not respond in time.' },
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly publicMessage: string;
  readonly severity: ErrorSeverity;
  readonly fields?: ApiErrorFields;
  readonly retryAfterSeconds?: number;

  constructor(options: AppErrorOptions) {
    super(options.internalMessage ?? options.publicMessage, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.publicMessage = options.publicMessage;
    this.severity = options.severity ?? (options.statusCode >= 500 ? 'error' : 'warn');
    this.fields = options.fields;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  toApiErrorData(requestId: string): ApiErrorData {
    return {
      code: this.code,
      message: this.publicMessage,
      requestId,
      ...(this.fields ? { fields: this.fields } : {}),
      ...(this.retryAfterSeconds === undefined ? {} : { retryAfterSeconds: this.retryAfterSeconds }),
    };
  }
}

export function createAppError(code: ApiErrorCode, options: CreateAppErrorOptions = {}): AppError {
  const defaults = API_ERROR_DEFAULTS[code];

  return new AppError({
    ...options,
    code,
    statusCode: defaults.statusCode,
    publicMessage: options.publicMessage ?? defaults.publicMessage,
  });
}
