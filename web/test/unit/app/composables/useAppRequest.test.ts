// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { useAppRequest } from '@/composables/useAppRequest';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import { withSetup } from './with-setup';

const apiFailure = { data: { code: API_ERROR_CODES.forbidden, message: 'Forbidden', requestId: 'r-1' } };

describe('useAppRequest', () => {
  test('exposes the result of a successful operation', async () => {
    const request = await withSetup(() => useAppRequest(async (value: number) => value * 2));

    expect(await request.execute(21)).toBe(42);
    expect(request.data.value).toBe(42);
    expect(request.hasFailed.value).toBe(false);
    expect(request.isPending.value).toBe(false);
  });

  test('turns an application failure into a localized message', async () => {
    const request = await withSetup(() =>
      useAppRequest(async () => {
        throw apiFailure;
      }),
    );

    expect(await request.execute()).toBeNull();
    expect(request.hasFailed.value).toBe(true);
    expect(request.error.value?.code).toBe(API_ERROR_CODES.forbidden);
    expect(request.errorMessage.value).toBe('Bạn không có quyền thực hiện thao tác này.');
  });

  test('falls back to a generic message for a failure that did not come from the application', async () => {
    const request = await withSetup(() =>
      useAppRequest(async () => {
        throw new Error('network down');
      }),
    );

    await request.execute();

    expect(request.error.value).toBeNull();
    expect(request.errorMessage.value).toBe('Có lỗi xảy ra. Vui lòng thử lại.');
  });

  test('ignores a superseded call and can be reset', async () => {
    let releaseFirst: (value: string) => void = () => undefined;
    const request = await withSetup(() =>
      useAppRequest((label: string) => (label === 'first' ? new Promise<string>((resolve) => (releaseFirst = resolve)) : Promise.resolve(label))),
    );

    const first = request.execute('first');
    await request.execute('second');
    releaseFirst('first');

    expect(await first).toBeNull();
    expect(request.data.value).toBe('second');

    request.reset();

    expect(request.data.value).toBeNull();
    expect(request.isPending.value).toBe(false);
  });
});
