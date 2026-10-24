import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createGoogleChatChannel } from '~~/server/notifications/channels/google-chat';
import { createSlackChannel } from '~~/server/notifications/channels/slack';
import { createErrorNotifier } from '~~/server/notifications/dispatcher';
import type { ErrorNotification, ErrorNotifyConfig } from '~~/server/notifications/types';
import type { ErrorSeverity } from '~~/shared/types/severity';

const { logWarn } = vi.hoisted(() => ({ logWarn: vi.fn() }));

vi.mock('~~/server/logging/logger', () => ({ logWarn, logError: vi.fn(), logInfo: vi.fn() }));

interface ReceivedRequest {
  path: string;
  body: string;
}

const AVATAR_URL = 'https://example.test/avatar.png';

let server: Server;
let port = 0;
let received: ReceivedRequest[] = [];

// The channels call the Nitro `$fetch` global, which the test runtime does not provide. This shim keeps
// the real HTTP round trip so the payload each provider would receive is asserted, not mocked away.
function installFetchShim(): void {
  vi.stubGlobal('$fetch', async (url: string, options: { method?: string; body?: unknown; signal?: AbortSignal }) => {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { 'content-type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`webhook responded ${response.status}`);
    }

    return response.text();
  });
}

function createConfig(overrides: Partial<ErrorNotifyConfig> = {}): ErrorNotifyConfig {
  return {
    enabled: true,
    minSeverity: 'error',
    dedupWindowSeconds: 300,
    timeoutMilliseconds: 2_000,
    slack: { enabled: false, webhookUrl: '', minSeverity: '', dedupWindowSeconds: 0 },
    googleChat: { enabled: false, webhookUrl: '', minSeverity: '', dedupWindowSeconds: 0, avatarUrl: '' },
    ...overrides,
  };
}

function createNotification(severity: ErrorSeverity = 'error', code = 'UPSTREAM_INVALID_RESPONSE'): ErrorNotification {
  return {
    code,
    statusCode: 502,
    severity,
    message: 'An upstream service returned an invalid response.',
    requestId: 'request-1',
    source: 'server',
    occurredAt: '2026-08-11T00:00:00.000Z',
    method: 'GET',
    path: '/api/example',
  };
}

function url(path: string): string {
  return `http://127.0.0.1:${port}${path}`;
}

// Gated behind NOTIFY_SMOKE so a normal `yarn test:unit` run performs no network calls: `yarn test:notify`
// sets it.
describe.skipIf(!process.env.NOTIFY_SMOKE)('notification channels', () => {
  beforeAll(async () => {
    installFetchShim();

    server = createServer((request, response) => {
      let body = '';

      request.on('data', (chunk) => (body += chunk));
      request.on('end', () => {
        received.push({ path: request.url ?? '', body });

        if (request.url === '/broken') {
          response.writeHead(500);
          response.end('nope');

          return;
        }
        if (request.url === '/slow') {
          setTimeout(() => response.end('ok'), 3_000);

          return;
        }

        response.end('ok');
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();

        port = typeof address === 'object' && address !== null ? address.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    received = [];
    logWarn.mockClear();
  });

  test('delivers a Slack payload that carries only client-safe detail', async () => {
    const notifier = createErrorNotifier(createConfig(), [createSlackChannel({ webhookUrl: url('/slack') })]);

    await notifier.notify(createNotification());

    expect(received).toHaveLength(1);
    expect(received[0]?.path).toBe('/slack');

    const payload = JSON.parse(received[0]?.body ?? '{}');

    expect(payload.text).toContain('[ERROR] UPSTREAM_INVALID_RESPONSE (502)');
    expect(payload.text).toContain('request: request-1');
    expect(payload.text).toContain('GET /api/example');
    expect(payload.text).not.toContain('secret');
    expect(payload.text).not.toContain('at Object.handler');
  });

  test('delivers a Google Chat card and uses the configured avatar as its header image', async () => {
    const notifier = createErrorNotifier(createConfig(), [createGoogleChatChannel({ webhookUrl: url('/google-chat'), avatarUrl: AVATAR_URL })]);

    await notifier.notify(createNotification());

    const payload = JSON.parse(received[0]?.body ?? '{}');
    const card = payload.cardsV2?.[0]?.card;

    expect(payload.text).toBe('[ERROR] UPSTREAM_INVALID_RESPONSE (502)');
    expect(card?.header?.imageUrl).toBe(AVATAR_URL);
    expect(card?.header?.subtitle).toBe('request request-1');
    expect(card?.sections?.[0]?.widgets?.[0]?.textParagraph?.text).toContain('An upstream service returned an invalid response.');
  });

  test('omits the card header image when no avatar is configured', async () => {
    const notifier = createErrorNotifier(createConfig(), [createGoogleChatChannel({ webhookUrl: url('/google-chat') })]);

    await notifier.notify(createNotification());

    expect(JSON.parse(received[0]?.body ?? '{}').cardsV2[0].card.header.imageUrl).toBeUndefined();
  });

  test('sends to every configured channel at once', async () => {
    const notifier = createErrorNotifier(createConfig(), [
      createSlackChannel({ webhookUrl: url('/slack') }),
      createGoogleChatChannel({ webhookUrl: url('/google-chat') }),
    ]);

    await notifier.notify(createNotification());

    expect(received.map((request) => request.path).sort()).toEqual(['/google-chat', '/slack']);
  });

  test('sends nothing while notifications are globally disabled', async () => {
    const notifier = createErrorNotifier(createConfig({ enabled: false }), [createSlackChannel({ webhookUrl: url('/slack') })]);

    await notifier.notify(createNotification());

    expect(received).toHaveLength(0);
  });

  test('sends nothing for a failure below the severity threshold', async () => {
    const notifier = createErrorNotifier(createConfig(), [createSlackChannel({ webhookUrl: url('/slack') })]);

    await notifier.notify(createNotification('warn'));

    expect(received).toHaveLength(0);
  });

  test('suppresses the same failure inside the deduplication window', async () => {
    const notifier = createErrorNotifier(createConfig(), [createSlackChannel({ webhookUrl: url('/slack') })]);

    await notifier.notify(createNotification());
    await notifier.notify(createNotification());

    expect(received).toHaveLength(1);
  });

  test('logs a rejected delivery instead of failing the caller', async () => {
    const notifier = createErrorNotifier(createConfig(), [createSlackChannel({ webhookUrl: url('/broken') })]);

    await expect(notifier.notify(createNotification())).resolves.toBeUndefined();

    expect(logWarn).toHaveBeenCalledWith('error notification delivery failed', expect.objectContaining({ source: 'notifications:slack' }));
  });

  test('abandons a webhook that exceeds the configured timeout', async () => {
    const notifier = createErrorNotifier(createConfig({ timeoutMilliseconds: 300 }), [createSlackChannel({ webhookUrl: url('/slow') })]);

    await expect(notifier.notify(createNotification())).resolves.toBeUndefined();

    expect(logWarn).toHaveBeenCalledWith('error notification delivery failed', expect.objectContaining({ source: 'notifications:slack' }));
  });
});
