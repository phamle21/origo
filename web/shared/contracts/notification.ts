import type { LocalizedText } from './content';

export const NOTIFICATION_KINDS = ['mention', 'memberAdded', 'roleChanged', 'taskAssigned'] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** One line under the bell. Fields beyond the common ones depend on the kind. */
export interface AppNotification {
  id: string;
  kind: NotificationKind;
  actor: { name: string; initials: string };
  project: { code: string; name: LocalizedText };
  /** mention: where the comment was written. */
  screen: { code: string; name: LocalizedText } | null;
  point: { number: number; title: LocalizedText } | null;
  excerpt: string | null;
  /** memberAdded, roleChanged: the role the person now holds. */
  role: { key: string; name: LocalizedText } | null;
  /** taskAssigned: the schedule entry they now own. */
  task: { itemName: LocalizedText; stageName: LocalizedText; startDate: string; endDate: string } | null;
  isRead: boolean;
  /** ISO-8601 timestamp. */
  at: string;
}

export interface NotificationFeed {
  items: AppNotification[];
  unreadCount: number;
}
