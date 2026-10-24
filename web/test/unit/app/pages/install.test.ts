// @vitest-environment nuxt
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import InstallPage from '@/pages/install.vue';
import type { InstallStatus } from '~~/shared/contracts/install';

const { fetchStatusMock, installMock, navigateToMock } = vi.hoisted(() => ({ fetchStatusMock: vi.fn(), installMock: vi.fn(), navigateToMock: vi.fn() }));

vi.mock('@/api/install/install', () => ({ fetchInstallStatus: fetchStatusMock, install: installMock }));
mockNuxtImport('navigateTo', () => navigateToMock);

async function mountWith(status: InstallStatus) {
  fetchStatusMock.mockResolvedValue(status);
  clearNuxtData('install-status');

  return mountSuspended(InstallPage);
}

const open: InstallStatus = { isInstalled: false, isTokenRequired: false, isTokenConfigured: false };

describe('install page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('creates the first administrator and leaves for the login page with the email', async () => {
    installMock.mockResolvedValue({ email: 'owner@example.com' });
    const wrapper = await mountWith(open);

    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2);

    await wrapper.get('input[autocomplete="name"]').setValue('Owner');
    await wrapper.get('input[type="email"]').setValue(' owner@example.com ');
    for (const input of wrapper.findAll('input[type="password"]')) {
      await input.setValue('a-strong-password');
    }
    await wrapper.get('form').trigger('submit');
    await new Promise((resolve) => setTimeout(resolve));

    expect(installMock).toHaveBeenCalledWith({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'a-strong-password',
      passwordConfirmation: 'a-strong-password',
      token: '',
    });
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/login', query: { installed: 'owner@example.com' } });
  });

  test('does not send mismatched passwords', async () => {
    const wrapper = await mountWith(open);

    await wrapper.get('input[autocomplete="name"]').setValue('Owner');
    await wrapper.get('input[type="email"]').setValue('owner@example.com');
    const passwords = wrapper.findAll('input[type="password"]');
    await passwords.at(0)?.setValue('a-strong-password');
    await passwords.at(1)?.setValue('another-password');
    await wrapper.get('form').trigger('submit');

    expect(installMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Hai mật khẩu chưa khớp nhau.');
  });

  test('asks for the install code when the server requires one', async () => {
    const wrapper = await mountWith({ isInstalled: false, isTokenRequired: true, isTokenConfigured: true });

    expect(wrapper.text()).toContain('Mã cài đặt');
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(3);
  });

  test('points to the command when the server allows no browser install', async () => {
    const wrapper = await mountWith({ isInstalled: false, isTokenRequired: true, isTokenConfigured: false });

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.text()).toContain('php artisan origo:install');
  });

  test('sends a finished install to the login page', async () => {
    await mountWith({ isInstalled: true, isTokenRequired: false, isTokenConfigured: false });

    expect(navigateToMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
