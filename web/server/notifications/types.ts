import type { ErrorSeverity } from '~~/shared/types/severity';

export interface ErrorNotification {
  code: string;
  statusCode: number;
  severity: ErrorSeverity;
  /** Client-safe message only; internal and provider text never leaves the log. */
  message: string;
  requestId: string;
  source: string;
  occurredAt: string;
  method?: string;
  path?: string;
}

export interface NotificationChannel {
  readonly name: string;
  /** Falls back to the global threshold when unset. */
  readonly minSeverity?: ErrorSeverity;
  /** Falls back to the global window when unset. */
  readonly dedupWindowSeconds?: number;
  send(notification: ErrorNotification, options: { timeoutMilliseconds: number }): Promise<void>;
}

export interface ChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  minSeverity: string;
  dedupWindowSeconds: number;
}

export interface ErrorNotifyConfig {
  enabled: boolean;
  minSeverity: string;
  dedupWindowSeconds: number;
  timeoutMilliseconds: number;
  slack: ChannelConfig;
  googleChat: ChannelConfig & { avatarUrl: string };
}
