import { fetchNotifications, markNotificationsRead } from '@/api/notification/notification';
import type { NotificationFeed } from '~~/shared/contracts/notification';

/**
 * The signed-in person's notifications, shared by the bell. Loaded in the browser only and refreshed
 * every minute while the tab is visible; a failed refresh keeps what was shown.
 */
export function useNotifications() {
  const feed = useState<NotificationFeed>('notifications', () => ({ items: [], unreadCount: 0 }));

  async function load(): Promise<void> {
    feed.value = await fetchNotifications().catch(() => feed.value);
  }

  async function markRead(ids?: string[]): Promise<void> {
    const wanted = ids ? new Set(ids) : null;
    const newlyRead = feed.value.items.filter((item) => !item.isRead && (!wanted || wanted.has(item.id))).length;

    // Shown read at once; the server catches up.
    feed.value = {
      items: feed.value.items.map((item) => (!wanted || wanted.has(item.id) ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, feed.value.unreadCount - newlyRead),
    };
    await markNotificationsRead(ids).catch(() => undefined);
  }

  return { feed, load, markRead };
}
