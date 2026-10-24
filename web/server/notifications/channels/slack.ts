import type { ErrorSeverity } from '~~/shared/types/severity';
import { formatNotificationDetails, formatNotificationTitle } from '../format';
import type { NotificationChannel } from '../types';

export interface SlackChannelOptions {
  webhookUrl: string;
  minSeverity?: ErrorSeverity;
  dedupWindowSeconds?: number;
}

export function createSlackChannel(options: SlackChannelOptions): NotificationChannel {
  return {
    name: 'slack',
    minSeverity: options.minSeverity,
    dedupWindowSeconds: options.dedupWindowSeconds,

    async send(notification, { timeoutMilliseconds }) {
      await $fetch(options.webhookUrl, {
        method: 'POST',
        body: { text: `*${formatNotificationTitle(notification)}*\n${formatNotificationDetails(notification)}` },
        signal: AbortSignal.timeout(timeoutMilliseconds),
        retry: 0,
      });
    },
  };
}
