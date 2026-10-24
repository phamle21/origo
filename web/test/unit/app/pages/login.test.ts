// @vitest-environment nuxt
import { describe, expect, test, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import LoginPage from '@/pages/login.vue';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

const { loginMock, navigateToMock } = vi.hoisted(() => ({ loginMock: vi.fn(), navigateToMock: vi.fn() }));

vi.mock('@/api/auth/auth', () => ({ login: loginMock, logout: vi.fn(), fetchCurrentUser: vi.fn() }));
mockNuxtImport('navigateTo', () => navigateToMock);

async function submit(email: string, password: string) {
  const wrapper = await mountSuspended(LoginPage);

  await wrapper.get('input[type="email"]').setValue(email);
  await wrapper.get('input[type="password"]').setValue(password);
  await wrapper.get('form').trigger('submit');
  await new Promise((resolve) => setTimeout(resolve));

  return wrapper;
}

describe('login page', () => {
  test('signs in and leaves for the home page', async () => {
    loginMock.mockResolvedValue({ name: 'Minh Anh', email: 'ba@origo.local', title: 'BA', initials: 'MA', isAdmin: false, permissions: [], systemRole: null });

    await submit(' ba@origo.local ', 'password');

    expect(loginMock).toHaveBeenCalledWith({ email: 'ba@origo.local', password: 'password' });
    expect(navigateToMock).toHaveBeenCalledWith('/');
  });

  test('shows a single message for a wrong email or password', async () => {
    loginMock.mockRejectedValue({ data: { code: API_ERROR_CODES.validationFailed, message: 'x', requestId: 'r' } });

    const wrapper = await submit('ba@origo.local', 'wrong');

    expect(wrapper.get('[role="alert"]').text()).toBe('Email hoặc mật khẩu không đúng.');
  });
});
