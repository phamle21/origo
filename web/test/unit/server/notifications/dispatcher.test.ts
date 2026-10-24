import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createErrorNotifier } from '~~/server/notifications/dispatcher';
import type { ErrorNotification, ErrorNotifyConfig, NotificationChannel } from '~~/server/notifications/types';
import type { ErrorSeverity } from '~~/shared/types/severity';

const { logWarn } = vi.hoisted(() => ({ logWarn: vi.fn() }));

vi.mock('~~/server/logging/logger', () => ({
  logWarn,
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

function createConfig(overrides: Partial<ErrorNotifyConfig> = {}): ErrorNotifyConfig {
  return {
    enabled: true,
    minSeverity: 'error',
    dedupWindowSeconds: 300,
    timeoutMilliseconds: 5_000,
    slack: { enabled: false, webhookUrl: '', minSeverity: '', dedupWindowSeconds: 0 },
    googleChat: { enabled: false, webhookUrl: '', minSeverity: '', dedupWindowSeconds: 0, avatarUrl: '' },
    ...overrides,
  };
}

function createChannel(overrides: Partial<NotificationChannel> = {}): NotificationChannel {
  return {
    name: 'test',
    send: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createNotification(severity: ErrorSeverity = 'error'): ErrorNotification {
  return {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    severity,
    message: 'An unexpected error occurred.',
    requestId: 'request-1',
    source: 'server',
    occurredAt: '2026-08-10T00:00:00.000Z',
    path: '/api/orders',
    method: 'GET',
  };
}

describe('createErrorNotifier', () => {
  beforeEach(() => {
    logWarn.mockClear();
  });

  test('sends nothing while notifications are globally disabled', async () => {
    const channel = createChannel();

    await createErrorNotifier(createConfig({ enabled: false }), [channel]).notify(createNotification());

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('sends nothing when no channel is configured', async () => {
    await expect(createErrorNotifier(createConfig(), []).notify(createNotification())).resolves.toBeUndefined();
  });

  test('delivers an eligible notification with the configured timeout', async () => {
    const channel = createChannel();
    const notification = createNotification();

    await createErrorNotifier(createConfig(), [channel]).notify(notification);

    expect(channel.send).toHaveBeenCalledWith(notification, { timeoutMilliseconds: 5_000 });
  });

  test('skips a notification below the global threshold', async () => {
    const channel = createChannel();

    await createErrorNotifier(createConfig(), [channel]).notify(createNotification('warn'));

    expect(channel.send).not.toHaveBeenCalled();
  });

  test('lets a channel threshold override the global one', async () => {
    const noisyChannel = createChannel({ name: 'noisy', minSeverity: 'warn' });
    const quietChannel = createChannel({ name: 'quiet' });

    await createErrorNotifier(createConfig(), [noisyChannel, quietChannel]).notify(createNotification('warn'));

    expect(noisyChannel.send).toHaveBeenCalledTimes(1);
    expect(quietChannel.send).not.toHaveBeenCalled();
  });

  test('suppresses a repeated failure inside the deduplication window', async () => {
    const channel = createChannel();
    const notifier = createErrorNotifier(createConfig(), [channel]);

    await notifier.notify(createNotification());
    await notifier.notify(createNotification());

    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  test('still delivers a different failure inside the window', async () => {
    const channel = createChannel();
    const notifier = createErrorNotifier(createConfig(), [channel]);

    await notifier.notify(createNotification());
    await notifier.notify({ ...createNotification(), code: 'UPSTREAM_TIMEOUT', statusCode: 504 });

    expect(channel.send).toHaveBeenCalledTimes(2);
  });

  test('logs a delivery failure without failing the caller or the other channel', async () => {
    const failingChannel = createChannel({ name: 'failing', send: vi.fn().mockRejectedValue(new Error('webhook unreachable')) });
    const workingChannel = createChannel({ name: 'working' });

    await expect(createErrorNotifier(createConfig(), [failingChannel, workingChannel]).notify(createNotification())).resolves.toBeUndefined();

    expect(workingChannel.send).toHaveBeenCalledTimes(1);
    expect(logWarn).toHaveBeenCalledWith(
      'error notification delivery failed',
      expect.objectContaining({ code: 'NOTIFICATION_DELIVERY_FAILED', source: 'notifications:failing' }),
    );
  });
});
