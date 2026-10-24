// @vitest-environment nuxt
import { afterEach, describe, expect, test, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import NotificationBell from '@/components/notification/NotificationBell.vue';
import type { NotificationFeed } from '~~/shared/contracts/notification';

const { fetchMock, readMock } = vi.hoisted(() => ({ fetchMock: vi.fn(), readMock: vi.fn() }));

vi.mock('@/api/notification/notification', () => ({ fetchNotifications: fetchMock, markNotificationsRead: readMock }));

const feed: NotificationFeed = {
  unreadCount: 1,
  items: [
    {
      id: 'n1',
      kind: 'taskAssigned',
      actor: { name: 'Minh Anh', initials: 'MA' },
      project: { code: 'LMS', name: { vi: 'Cổng học' } },
      screen: null,
      point: null,
      excerpt: null,
      role: null,
      task: { itemName: { vi: 'Giỏ hàng' }, stageName: { vi: 'Phát triển' }, startDate: '2026-11-01', endDate: '2026-11-05' },
      isRead: false,
      at: new Date().toISOString(),
    },
  ],
};

describe('NotificationBell', () => {
  afterEach(() => {
    fetchMock.mockReset();
    readMock.mockReset();
    useState('notifications').value = { items: [], unreadCount: 0 };
  });

  test('shows the unread count, words each notification and links to the place', async () => {
    fetchMock.mockResolvedValue(feed);
    readMock.mockResolvedValue({ ok: true });
    const wrapper = await mountSuspended(NotificationBell);
    await flushPromises();

    expect(wrapper.get('button').text()).toContain('1');
    await wrapper.get('button').trigger('click');
    await flushPromises();

    const link = wrapper.get('li a');
    expect(link.text()).toContain('Minh Anh đã giao bạn phụ trách Phát triển của “Giỏ hàng”');
    expect(link.attributes('href')).toBe('/p/LMS/plan');

    await wrapper.findAll('header button').at(0)?.trigger('click');
    expect(readMock).toHaveBeenCalledWith(undefined);
    expect(wrapper.get('button').text()).not.toContain('1');
  });

  test('says when there is nothing yet', async () => {
    fetchMock.mockResolvedValue({ items: [], unreadCount: 0 });
    const wrapper = await mountSuspended(NotificationBell);

    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Chưa có thông báo nào');
  });
});
