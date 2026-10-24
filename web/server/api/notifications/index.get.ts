import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { notificationFeedDtoSchema, toNotificationFeed } from '~~/server/integrations/origo-api/dto/notification.dto';
import type { NotificationFeed } from '~~/shared/contracts/notification';

export default defineApiHandler(async (event): Promise<NotificationFeed> => {
  return toNotificationFeed(notificationFeedDtoSchema.parse(await createOrigoApiClient(event)('/notifications')));
});
