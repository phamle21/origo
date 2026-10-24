import { ZodError } from 'zod';
import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorFields } from '~~/shared/contracts/api-error';
import { AppError, createAppError } from './app-error';

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: API_ERROR_CODES.validationFailed,
  401: API_ERROR_CODES.unauthenticated,
  403: API_ERROR_CODES.forbidden,
  404: API_ERROR_CODES.notFound,
  409: API_ERROR_CODES.conflict,
  413: API_ERROR_CODES.payloadTooLarge,
  422: API_ERROR_CODES.unprocessable,
  429: API_ERROR_CODES.rateLimited,
  504: API_ERROR_CODES.upstreamTimeout,
};

const TIMEOUT_ERROR_NAMES = new Set(['TimeoutError', 'AbortError']);
const MAX_CAUSE_DEPTH = 3;

// Errors reach this boundary as `AppError`, an h3 error, an ofetch error, or a Zod failure. They are
// recognized structurally so normalization stays free of framework runtime imports and unit testable.
interface StatusCarryingError {
  statusCode?: unknown;
  status?: unknown;
  data?: unknown;
  name?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStatusCode(error: StatusCarryingError): number | undefined {
  const candidate = typeof error.statusCode === 'number' ? error.statusCode : error.status;

  return typeof candidate === 'number' ? candidate : undefined;
}

function isFetchError(error: Record<string, unknown>): boolean {
  return error.name === 'FetchError' || 'response' in error;
}

// A transport timeout is often wrapped, so the cause chain is inspected up to a bounded depth.
function isTimeoutError(error: unknown, depth = 0): boolean {
  if (!isObject(error) || depth > MAX_CAUSE_DEPTH) {
    return false;
  }
  if (typeof error.name === 'string' && TIMEOUT_ERROR_NAMES.has(error.name)) {
    return true;
  }

  return isTimeoutError(error.cause, depth + 1);
}

export function toApiErrorFields(error: ZodError): ApiErrorFields {
  const fields: ApiErrorFields = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'root';
    fields[field] = [...(fields[field] ?? []), issue.code];
  }

  return fields;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // A raw Zod failure originates from parsing an external response, not from validating request input.
  if (error instanceof ZodError) {
    return createAppError(API_ERROR_CODES.upstreamInvalidResponse, {
      internalMessage: `upstream response failed schema validation: ${error.message}`,
      cause: error,
    });
  }

  if (!isObject(error)) {
    return createAppError(API_ERROR_CODES.internalError, { internalMessage: `non-error value thrown: ${String(error)}`, cause: error });
  }

  if (isTimeoutError(error)) {
    return createAppError(API_ERROR_CODES.upstreamTimeout, { cause: error });
  }

  const statusCode = getStatusCode(error);

  if (isFetchError(error)) {
    const code = statusCode === 504 || statusCode === 408 ? API_ERROR_CODES.upstreamTimeout : API_ERROR_CODES.upstreamInvalidResponse;

    return createAppError(code, { internalMessage: `upstream request failed with status ${statusCode ?? 'unknown'}`, cause: error });
  }

  if (statusCode === undefined) {
    return createAppError(API_ERROR_CODES.internalError, { cause: error });
  }

  // `readValidatedBody` and `getValidatedQuery` wrap a Zod failure in an h3 error, so the field issues
  // are recovered here instead of being reported as a generic bad request.
  if (statusCode === 400 && error.data instanceof ZodError) {
    return createAppError(API_ERROR_CODES.validationFailed, { fields: toApiErrorFields(error.data), cause: error.data });
  }

  const code = STATUS_CODES[statusCode] ?? (statusCode >= 500 ? API_ERROR_CODES.internalError : API_ERROR_CODES.unprocessable);

  return createAppError(code, { cause: error });
}
