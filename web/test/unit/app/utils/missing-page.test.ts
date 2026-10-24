import { describe, expect, test } from 'vitest';
import { isMissingPageError } from '@/utils/missing-page';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

function apiError(code: (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]) {
  return { code, message: 'x', requestId: 'r-1' };
}

describe('isMissingPageError', () => {
  test('treats an unknown or malformed code in the URL as a missing page', () => {
    expect(isMissingPageError(apiError(API_ERROR_CODES.notFound))).toBe(true);
    expect(isMissingPageError(apiError(API_ERROR_CODES.validationFailed))).toBe(true);
  });

  test('keeps other failures and non-application failures on the page', () => {
    expect(isMissingPageError(apiError(API_ERROR_CODES.upstreamTimeout))).toBe(false);
    expect(isMissingPageError(apiError(API_ERROR_CODES.forbidden))).toBe(false);
    expect(isMissingPageError(null)).toBe(false);
  });
});
