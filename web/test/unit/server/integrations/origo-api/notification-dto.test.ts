import { describe, expect, test } from 'vitest';
import { notificationFeedDtoSchema, toNotificationFeed } from '~~/server/integrations/origo-api/dto/notification.dto';

describe('notification feed', () => {
  test('keeps known kinds and skips unknown or broken entries', () => {
    const feed = toNotificationFeed(
      notificationFeedDtoSchema.parse({
        data: [
          {
            id: 'a',
            isRead: false,
            at: '2026-10-27T08:00:00Z',
            data: {
              kind: 'mention',
              actor: { name: 'Minh Anh', initials: 'MA' },
              project: { code: 'LMS', name: { vi: 'Cổng học' } },
              screen: { code: 'SC-02', name: { vi: 'Giỏ hàng' } },
              point: { number: 2, title: { vi: 'Mã giảm giá' } },
              excerpt: '@Quang xem nhé',
            },
          },
          {
            id: 'b',
            isRead: true,
            at: '2026-10-27T07:00:00Z',
            data: { kind: 'somethingNew', actor: { name: 'X', initials: 'X' }, project: { code: 'LMS', name: { vi: 'L' } } },
          },
          { id: 'c', isRead: true, at: '2026-10-27T06:00:00Z', data: { kind: 'roleChanged' } },
        ],
        meta: { unreadCount: 1 },
      }),
    );

    expect(feed.unreadCount).toBe(1);
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({ id: 'a', kind: 'mention', point: { number: 2 }, role: null, task: null, isRead: false });
  });
});
