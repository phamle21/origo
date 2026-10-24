// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppLauncher from '@/components/layout/AppLauncher.vue';

const apps = [
  { id: 'projects' as const, label: 'Dự án', tile: 'projects' as const, to: '/' },
  { id: 'settings' as const, label: 'Cài đặt', tile: 'settings' as const, to: '/settings' },
];

describe('AppLauncher', () => {
  test('opens a grid of apps, marks the current one and closes on Escape', async () => {
    const wrapper = await mountSuspended(AppLauncher, { props: { apps, current: 'settings' }, attachTo: document.body });
    const trigger = wrapper.get('button[aria-haspopup]');

    expect(wrapper.get('nav').isVisible()).toBe(false);
    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('nav a').map((link) => link.text())).toEqual(['Dự án', 'Cài đặt']);
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('Cài đặt');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  test('closes when clicking outside', async () => {
    const wrapper = await mountSuspended(AppLauncher, { props: { apps: apps.slice(0, 1), current: 'projects' }, attachTo: document.body });

    await wrapper.get('button[aria-haspopup]').trigger('click');
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.get('button[aria-haspopup]').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });
});
