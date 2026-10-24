import { z } from 'zod';
import { localizedTextDtoSchema } from './localized-text.dto';
import { NOTIFICATION_KINDS, type AppNotification, type NotificationFeed } from '~~/shared/contracts/notification';

const dataSchema = z.object({
  kind: z.string(),
  actor: z.object({ name: z.string(), initials: z.string() }),
  project: z.object({ code: z.string(), name: localizedTextDtoSchema }),
  screen: z.object({ code: z.string(), name: localizedTextDtoSchema }).nullish(),
  point: z.object({ number: z.number().int(), title: localizedTextDtoSchema }).nullish(),
  excerpt: z.string().nullish(),
  role: z.object({ key: z.string(), name: localizedTextDtoSchema }).nullish(),
  task: z.object({ itemName: localizedTextDtoSchema, stageName: localizedTextDtoSchema, startDate: z.string(), endDate: z.string() }).nullish(),
});

const entrySchema = z.object({ id: z.string(), data: z.unknown(), isRead: z.boolean(), at: z.string() });

export const notificationFeedDtoSchema = z.object({
  data: z.array(entrySchema),
  meta: z.object({ unreadCount: z.number().int().nonnegative() }),
});

/** Kinds this web version does not know, or entries with broken data, are skipped instead of failing the bell. */
export function toNotificationFeed(response: z.infer<typeof notificationFeedDtoSchema>): NotificationFeed {
  const items: AppNotification[] = [];

  for (const entry of response.data) {
    const parsed = dataSchema.safeParse(entry.data);

    if (parsed.success && (NOTIFICATION_KINDS as readonly string[]).includes(parsed.data.kind)) {
      const data = parsed.data;

      items.push({
        id: entry.id,
        kind: data.kind as AppNotification['kind'],
        actor: data.actor,
        project: data.project,
        screen: data.screen ?? null,
        point: data.point ?? null,
        excerpt: data.excerpt ?? null,
        role: data.role ?? null,
        task: data.task ?? null,
        isRead: entry.isRead,
        at: entry.at,
      });
    }
  }

  return { items, unreadCount: response.meta.unreadCount };
}
