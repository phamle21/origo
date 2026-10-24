import { createDeduplicator, type Deduplicator } from '~~/server/logging/dedup';
import { logWarn } from '~~/server/logging/logger';
import type { ErrorSeverity } from '~~/shared/types/severity';
import { createConfiguredChannels } from './channels';
import { isSeverityAtLeast, toSeverity } from './severity';
import type { ErrorNotification, ErrorNotifyConfig, NotificationChannel } from './types';

const DEFAULT_MIN_SEVERITY: ErrorSeverity = 'error';

export interface ErrorNotifier {
  notify(notification: ErrorNotification): Promise<void>;
}

interface ChannelRoute {
  channel: NotificationChannel;
  minSeverity: ErrorSeverity;
  deduplicator: Deduplicator;
}

function buildDeduplicationKey(notification: ErrorNotification): string {
  return [notification.code, notification.statusCode, notification.path ?? '-'].join('|');
}

/**
 * Applies the shared eligibility rules once: the global switch, then each channel's own severity
 * threshold and deduplication window. Delivery never rejects, so a failing channel cannot reach the
 * request path or silence another channel.
 */
export function createErrorNotifier(config: ErrorNotifyConfig, channels: NotificationChannel[] = createConfiguredChannels(config)): ErrorNotifier {
  const globalMinSeverity = toSeverity(config.minSeverity) ?? DEFAULT_MIN_SEVERITY;
  const routes: ChannelRoute[] = channels.map((channel) => ({
    channel,
    minSeverity: channel.minSeverity ?? globalMinSeverity,
    deduplicator: createDeduplicator({ windowSeconds: channel.dedupWindowSeconds ?? config.dedupWindowSeconds }),
  }));

  return {
    async notify(notification) {
      if (!config.enabled || routes.length === 0) {
        return;
      }

      const key = buildDeduplicationKey(notification);
      const deliveries: Promise<void>[] = [];

      for (const route of routes) {
        if (!isSeverityAtLeast(notification.severity, route.minSeverity) || !route.deduplicator.shouldAccept(key)) {
          continue;
        }

        deliveries.push(
          route.channel.send(notification, { timeoutMilliseconds: config.timeoutMilliseconds }).catch((error: unknown) => {
            logWarn('error notification delivery failed', {
              code: 'NOTIFICATION_DELIVERY_FAILED',
              severity: 'warn',
              requestId: notification.requestId,
              source: `notifications:${route.channel.name}`,
              error,
            });
          }),
        );
      }

      await Promise.all(deliveries);
    },
  };
}
