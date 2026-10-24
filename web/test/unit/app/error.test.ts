// @vitest-environment nuxt
import { describe, expect, test, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import ErrorPage from '@/error.vue';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

const { clearErrorMock } = vi.hoisted(() => ({ clearErrorMock: vi.fn().mockResolvedValue(undefined) }));

mockNuxtImport('clearError', () => clearErrorMock);

function mountErrorPage(error: Record<string, unknown> | undefined) {
  return mountSuspended(ErrorPage, { props: { error } as never });
}

describe('error.vue', () => {
  test('renders the not-found copy for a missing route', async () => {
    const wrapper = await mountErrorPage({ statusCode: 404, statusMessage: 'Page not found' });

    expect(wrapper.get('h1').text()).toBe('Không tìm thấy trang');
    expect(wrapper.text()).toContain('không tồn tại hoặc đã được chuyển');
  });

  test('renders the generic copy for an unexpected failure', async () => {
    const wrapper = await mountErrorPage({ statusCode: 500 });

    expect(wrapper.get('h1').text()).toBe('Có lỗi xảy ra');
    expect(wrapper.text()).toContain('500');
  });

  test('never renders the internal error message or stack', async () => {
    const wrapper = await mountErrorPage({
      statusCode: 500,
      message: 'connection string secret=1 failed',
      statusMessage: 'connection string secret=1 failed',
      stack: 'Error: at repository.ts:12',
    });

    expect(wrapper.text()).not.toContain('secret=1');
    expect(wrapper.text()).not.toContain('repository.ts');
  });

  test('shows the application request id when the failure carries one', async () => {
    const wrapper = await mountErrorPage({
      statusCode: 502,
      data: { code: API_ERROR_CODES.upstreamInvalidResponse, message: 'upstream failed', requestId: 'request-42' },
    });

    expect(wrapper.text()).toContain('Mã tham chiếu: request-42');
  });

  test('omits the reference line when there is no request id', async () => {
    const wrapper = await mountErrorPage({ statusCode: 500 });

    expect(wrapper.text()).not.toContain('Mã tham chiếu:');
  });

  test('clears the error and returns home', async () => {
    clearErrorMock.mockClear();

    const wrapper = await mountErrorPage({ statusCode: 404 });
    await wrapper.get('button').trigger('click');

    expect(clearErrorMock).toHaveBeenCalledWith({ redirect: '/' });
  });

  test('falls back to a 500 when no error is supplied', async () => {
    const wrapper = await mountErrorPage(undefined);

    expect(wrapper.text()).toContain('500');
  });
});
