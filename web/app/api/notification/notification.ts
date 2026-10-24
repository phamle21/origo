import { useApiClient } from '@/api/client';
import type { NotificationFeed } from '~~/shared/contracts/notification';

export function fetchNotifications(): Promise<NotificationFeed> {
  return useApiClient()<NotificationFeed>('/api/notifications');
}

/** Marks the given notifications read, or all of them without ids. */
export function markNotificationsRead(ids?: string[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/notifications/read', { method: 'POST', body: ids ? { ids } : {} });
}
