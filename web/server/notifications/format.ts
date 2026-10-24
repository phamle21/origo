import type { ErrorNotification } from './types';

export function formatNotificationTitle(notification: ErrorNotification): string {
  return `[${notification.severity.toUpperCase()}] ${notification.code} (${notification.statusCode})`;
}

/** Diagnostic lines only. Credentials, personal data, and provider payloads never reach a channel. */
export function formatNotificationDetails(notification: ErrorNotification): string {
  const lines = [
    `message: ${notification.message}`,
    `request: ${notification.requestId}`,
    `source: ${notification.source}`,
    `occurred: ${notification.occurredAt}`,
  ];

  if (notification.method && notification.path) {
    lines.splice(1, 0, `route: ${notification.method} ${notification.path}`);
  }

  return lines.join('\n');
}
