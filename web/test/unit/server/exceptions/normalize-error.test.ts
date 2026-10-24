import { describe, expect, test } from 'vitest';
import { z, type ZodError } from 'zod';
import { AppError, createAppError } from '~~/server/exceptions/app-error';
import { toApiErrorFields, toAppError } from '~~/server/exceptions/normalize-error';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

const schema = z.object({ name: z.string(), age: z.number() });

function getZodError(input: unknown): ZodError {
  const result = schema.safeParse(input);

  if (result.success) {
    throw new Error('expected the fixture to fail validation');
  }

  return result.error;
}

describe('toAppError', () => {
  test('returns an existing application error unchanged', () => {
    const original = createAppError(API_ERROR_CODES.notFound);

    expect(toAppError(original)).toBe(original);
  });

  test('treats a raw schema failure as an invalid upstream response', () => {
    const appError = toAppError(getZodError({ name: 1, age: 'x' }));

    expect(appError.code).toBe(API_ERROR_CODES.upstreamInvalidResponse);
    expect(appError.statusCode).toBe(502);
    expect(appError.severity).toBe('error');
  });

  test('recovers field issues from a validated request body failure', () => {
    const zodError = getZodError({ name: 1, age: 'x' });
    const appError = toAppError({ statusCode: 400, statusMessage: 'Validation Error', data: zodError });

    expect(appError.code).toBe(API_ERROR_CODES.validationFailed);
    expect(appError.fields).toEqual({ name: ['invalid_type'], age: ['invalid_type'] });
  });

  test('maps a failed upstream request to a gateway error', () => {
    const appError = toAppError({ name: 'FetchError', statusCode: 500, response: {} });

    expect(appError.code).toBe(API_ERROR_CODES.upstreamInvalidResponse);
    expect(appError.message).toContain('500');
  });

  test('maps an upstream gateway timeout to a timeout error', () => {
    const appError = toAppError({ name: 'FetchError', statusCode: 504, response: {} });

    expect(appError.code).toBe(API_ERROR_CODES.upstreamTimeout);
    expect(appError.statusCode).toBe(504);
  });

  test('detects a timeout wrapped in a cause chain', () => {
    const appError = toAppError(new Error('request failed', { cause: { name: 'TimeoutError' } }));

    expect(appError.code).toBe(API_ERROR_CODES.upstreamTimeout);
  });

  test('maps a known status without a payload to its application code', () => {
    expect(toAppError({ statusCode: 404 }).code).toBe(API_ERROR_CODES.notFound);
    expect(toAppError({ statusCode: 429 }).code).toBe(API_ERROR_CODES.rateLimited);
  });

  test('falls back to an internal error for an unrecognized value', () => {
    const appError = toAppError('boom');

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe(API_ERROR_CODES.internalError);
    expect(appError.statusCode).toBe(500);
  });

  test('keeps the public message free of the internal message', () => {
    const appError = toAppError(new Error('connection string secret=1 failed'));

    expect(appError.publicMessage).toBe('An unexpected error occurred.');
    expect(appError.toApiErrorData('request-1')).toEqual({
      code: API_ERROR_CODES.internalError,
      message: 'An unexpected error occurred.',
      requestId: 'request-1',
    });
  });
});

describe('toApiErrorFields', () => {
  test('groups issue codes by field path', () => {
    const fields = toApiErrorFields(getZodError({ age: 'x' }));

    expect(fields).toEqual({ name: ['invalid_type'], age: ['invalid_type'] });
  });
});
