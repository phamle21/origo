import { describe, expect, test } from 'vitest';
import { getApiErrorMessageKey, toApiErrorData } from '@/api/client';
import { API_ERROR_CODES, type ApiErrorData } from '~~/shared/contracts/api-error';

const apiErrorData: ApiErrorData = {
  code: API_ERROR_CODES.notFound,
  message: 'The requested resource does not exist.',
  requestId: 'request-1',
};

describe('toApiErrorData', () => {
  test('reads the contract nested in a failed request payload', () => {
    const error = { statusCode: 404, data: { statusCode: 404, message: 'not found', data: apiErrorData } };

    expect(toApiErrorData(error)).toEqual(apiErrorData);
  });

  test('reads the contract when it is the payload itself', () => {
    expect(toApiErrorData({ data: apiErrorData })).toEqual(apiErrorData);
  });

  test('accepts an already extracted contract', () => {
    expect(toApiErrorData(apiErrorData)).toEqual(apiErrorData);
  });

  test('returns null for a failure that did not come from the application boundary', () => {
    expect(toApiErrorData(new Error('network down'))).toBeNull();
    expect(toApiErrorData({ data: { statusCode: 502 } })).toBeNull();
    expect(toApiErrorData(undefined)).toBeNull();
  });

  test('rejects a payload carrying an unknown error code', () => {
    expect(toApiErrorData({ data: { ...apiErrorData, code: 'TEAPOT' } })).toBeNull();
  });
});

describe('getApiErrorMessageKey', () => {
  test('maps a known code to its namespaced message key', () => {
    expect(getApiErrorMessageKey(apiErrorData)).toBe('errors.notFound');
  });

  test('falls back to the unknown message key', () => {
    expect(getApiErrorMessageKey(null)).toBe('errors.unknown');
  });
});
