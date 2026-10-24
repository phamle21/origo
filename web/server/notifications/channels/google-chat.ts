import type { ErrorSeverity } from '~~/shared/types/severity';
import { formatNotificationDetails, formatNotificationTitle } from '../format';
import type { NotificationChannel } from '../types';

export interface GoogleChatChannelOptions {
  webhookUrl: string;
  /** Rendered as the card header image; Google Chat webhooks cannot override the sender avatar. */
  avatarUrl?: string;
  minSeverity?: ErrorSeverity;
  dedupWindowSeconds?: number;
}

export function createGoogleChatChannel(options: GoogleChatChannelOptions): NotificationChannel {
  return {
    name: 'googleChat',
    minSeverity: options.minSeverity,
    dedupWindowSeconds: options.dedupWindowSeconds,

    async send(notification, { timeoutMilliseconds }) {
      const title = formatNotificationTitle(notification);

      await $fetch(options.webhookUrl, {
        method: 'POST',
        body: {
          text: title,
          cardsV2: [
            {
              cardId: 'error-notification',
              card: {
                header: {
                  title,
                  subtitle: `request ${notification.requestId}`,
                  ...(options.avatarUrl ? { imageUrl: options.avatarUrl, imageType: 'CIRCLE' } : {}),
                },
                sections: [{ widgets: [{ textParagraph: { text: formatNotificationDetails(notification) } }] }],
              },
            },
          ],
        },
        signal: AbortSignal.timeout(timeoutMilliseconds),
        retry: 0,
      });
    },
  };
}
