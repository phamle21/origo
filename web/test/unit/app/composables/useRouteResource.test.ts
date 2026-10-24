// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { useRouteResource } from '@/composables/useRouteResource';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import { withSetup } from './with-setup';

function failWith(code: string) {
  return async () => {
    throw { data: { code, message: 'x', requestId: 'r-1' } };
  };
}

describe('useRouteResource', () => {
  test('returns the loaded data', async () => {
    const resource = await await withSetup(() => useRouteResource('resource:ok', async () => ({ name: 'LMS' })));

    expect(resource.data.value).toEqual({ name: 'LMS' });
    expect(resource.hasFailed.value).toBe(false);
    expect(resource.errorMessage.value).toBe('');
  });

  test('keeps any other failure inline with a localized message', async () => {
    const resource = await await withSetup(() => useRouteResource('resource:failed', failWith(API_ERROR_CODES.upstreamTimeout)));

    expect(resource.data.value).toBeNull();
    expect(resource.hasFailed.value).toBe(true);
    expect(resource.errorMessage.value).toContain('phản hồi quá lâu');
  });
});
