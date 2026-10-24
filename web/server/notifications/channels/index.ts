import { toSeverity } from '../severity';
import type { ErrorNotifyConfig, NotificationChannel } from '../types';
import { createGoogleChatChannel } from './google-chat';
import { createSlackChannel } from './slack';

/**
 * Builds the channels a deployment has actually configured. A channel needs both its own switch and a
 * webhook URL; the global switch is enforced once by the dispatcher.
 */
export function createConfiguredChannels(config: ErrorNotifyConfig): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  if (config.slack.enabled && config.slack.webhookUrl) {
    channels.push(
      createSlackChannel({
        webhookUrl: config.slack.webhookUrl,
        minSeverity: toSeverity(config.slack.minSeverity),
        dedupWindowSeconds: config.slack.dedupWindowSeconds || undefined,
      }),
    );
  }

  if (config.googleChat.enabled && config.googleChat.webhookUrl) {
    channels.push(
      createGoogleChatChannel({
        webhookUrl: config.googleChat.webhookUrl,
        avatarUrl: config.googleChat.avatarUrl || undefined,
        minSeverity: toSeverity(config.googleChat.minSeverity),
        dedupWindowSeconds: config.googleChat.dedupWindowSeconds || undefined,
      }),
    );
  }

  return channels;
}
