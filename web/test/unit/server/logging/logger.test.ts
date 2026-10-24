import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { configureLogger, logDebug, logError, logFatal, logInfo, logWarn } from '~~/server/logging/logger';

const { appendFile, mkdir, readdir, unlink } = vi.hoisted(() => ({
  appendFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([] as Array<{ name: string; isFile(): boolean }>),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => ({ appendFile, mkdir, readdir, unlink, default: { appendFile, mkdir, readdir, unlink } }));

function getWrittenEntry(): string {
  const call = appendFile.mock.calls.at(-1);

  return String(call?.[1] ?? '');
}

function getWrittenPath(): string {
  return String(appendFile.mock.calls.at(-1)?.[0] ?? '');
}

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readdir.mockResolvedValue([]);
    configureLogger({ channel: 'daily', retentionDays: 14 });
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('writes the day file and a one-line header with key=value context', async () => {
    logWarn('request rejected', { code: 'VALIDATION_FAILED', statusCode: 400, requestId: 'request-1' });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    const [header] = getWrittenEntry().split('\n');

    expect(getWrittenPath()).toMatch(/logs\/\d{4}-\d{2}-\d{2}\.log$/);
    expect(header).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d:.]+Z\] WARN request rejected \| code=VALIDATION_FAILED statusCode=400 requestId=request-1$/);
  });

  test('collapses a multi-line message so the header stays greppable', async () => {
    logError('schema failed:\n  [\n    { "path": "price" }\n  ]', { code: 'UPSTREAM_INVALID_RESPONSE' });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    const [header] = getWrittenEntry().split('\n');

    expect(header).toContain('schema failed: [ { "path": "price" } ]');
  });

  test('redacts sensitive context before writing', async () => {
    logError('upstream call failed', { requestId: 'request-1', authorization: 'Bearer token' });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    const entry = getWrittenEntry();

    expect(entry).toContain('authorization=[redacted]');
    expect(entry).not.toContain('Bearer token');
  });

  test('redacts secrets from messages, paths, and stacks before writing', async () => {
    const error = new Error('request failed for token=stack-secret and user@example.com');

    logError('Bearer message-secret failed', {
      path: 'https://shop.example.test/reset?token=url-secret#details',
      error,
    });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    const entry = getWrittenEntry();

    expect(entry).toContain('Bearer [redacted]');
    expect(entry).toContain('https://shop.example.test/reset?[redacted]#[redacted]');
    expect(entry).not.toContain('message-secret');
    expect(entry).not.toContain('url-secret');
    expect(entry).not.toContain('stack-secret');
    expect(entry).not.toContain('user@example.com');
  });

  test('records the cause chain as an indented block', async () => {
    const cause = new Error('connection reset');
    const error = new Error('upstream request failed', { cause });

    logError(error.message, { error });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    const entry = getWrittenEntry();

    expect(entry).toContain('caused by: Error: connection reset');
    expect(entry.split('\n').at(1)).toMatch(/^ {4}Error: upstream request failed$/);
  });

  test('omits the stack block when no error is supplied', async () => {
    logWarn('nothing thrown', { code: 'CLIENT_ERROR_REPORT' });
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    expect(getWrittenEntry().split('\n').filter(Boolean)).toHaveLength(1);
  });

  test('stdout channel emits structured JSON without writing a file', () => {
    configureLogger({ channel: 'stdout', retentionDays: 14 });

    logWarn('request rejected', { requestId: 'request-1' });

    expect(appendFile).not.toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringMatching(/^\{"level":"warn","time":"[^"]+","message":"request rejected"/));
  });

  test('records only events at or above the configured level', async () => {
    configureLogger({ channel: 'daily', level: 'error', retentionDays: 30 });

    logDebug('debug event');
    logInfo('info event');
    logWarn('warning event');
    logError('error event');
    logFatal('fatal event');
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalledTimes(2));

    const entries = appendFile.mock.calls.map((call) => String(call[1])).join('');

    expect(entries).not.toContain('debug event');
    expect(entries).not.toContain('info event');
    expect(entries).not.toContain('warning event');
    expect(entries).toContain('error event');
    expect(entries).toContain('fatal event');
  });

  test('daily channel removes log files older than the retention window', async () => {
    readdir.mockResolvedValue([
      { name: '2000-01-01.log', isFile: () => true },
      { name: 'notes.txt', isFile: () => true },
    ]);
    configureLogger({ channel: 'daily', retentionDays: 14 });

    logWarn('retention check');
    await vi.waitFor(() => expect(appendFile).toHaveBeenCalled());

    expect(unlink).toHaveBeenCalledWith(expect.stringMatching(/logs\/2000-01-01\.log$/));
    expect(unlink).not.toHaveBeenCalledWith(expect.stringMatching(/notes\.txt$/));
  });
});
