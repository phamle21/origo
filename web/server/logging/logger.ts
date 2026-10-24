import { appendFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { ErrorSeverity } from '~~/shared/types/severity';
import { redactText, redactValue } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogChannel = 'stdout' | 'daily' | 'stack';

export interface LoggerConfig {
  channel: LogChannel;
  level: LogLevel;
  retentionDays: number;
}

export interface LoggerConfigInput {
  channel?: unknown;
  level?: unknown;
  retentionDays?: unknown;
}

export interface LogContext {
  code?: string;
  statusCode?: number;
  severity?: ErrorSeverity;
  requestId?: string;
  method?: string;
  path?: string;
  source?: string;
  /** Thrown value whose sanitized stack is written with the event. */
  error?: unknown;
  [key: string]: unknown;
}

const LOG_DIRECTORY = join(process.cwd(), 'logs');
const LOG_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}\.log$/;
const MAX_STACK_CHARACTERS = 8_192;
const MAX_MESSAGE_CHARACTERS = 1_024;
const MAX_CAUSE_DEPTH = 2;
const STACK_INDENT = '    ';
const DEFAULT_LOG_LEVEL: LogLevel = 'warn';
const DEFAULT_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 365;
const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

let loggerConfig: LoggerConfig = {
  channel: 'daily',
  level: DEFAULT_LOG_LEVEL,
  retentionDays: DEFAULT_RETENTION_DAYS,
};
let preparedLogDay = '';
let prepareLogDirectoryPromise: Promise<void> | null = null;

function isLogChannel(value: unknown): value is LogChannel {
  return value === 'stdout' || value === 'daily' || value === 'stack';
}

function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && value in LOG_LEVEL_RANK;
}

export function configureLogger(config: LoggerConfigInput): void {
  const retentionDays = Number(config.retentionDays);

  loggerConfig = {
    channel: isLogChannel(config.channel) ? config.channel : 'daily',
    level: isLogLevel(config.level) ? config.level : DEFAULT_LOG_LEVEL,
    retentionDays: Number.isFinite(retentionDays) ? Math.min(MAX_RETENTION_DAYS, Math.max(1, Math.trunc(retentionDays))) : DEFAULT_RETENTION_DAYS,
  };
  preparedLogDay = '';
  prepareLogDirectoryPromise = null;
}

function getUtcDay(time: string): string {
  return time.slice(0, 10);
}

function getLogFilePath(day: string): string {
  return join(LOG_DIRECTORY, `${day}.log`);
}

function getOldestRetainedDay(day: string, retentionDays: number): string {
  const cutoff = new Date(`${day}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - (retentionDays - 1));

  return cutoff.toISOString().slice(0, 10);
}

async function deleteExpiredLogFiles(day: string): Promise<void> {
  const oldestRetainedDay = getOldestRetainedDay(day, loggerConfig.retentionDays);
  const entries = await readdir(LOG_DIRECTORY, { withFileTypes: true });
  const deletions = entries
    .filter((entry) => entry.isFile() && LOG_FILE_PATTERN.test(entry.name) && entry.name.slice(0, 10) < oldestRetainedDay)
    .map((entry) => unlink(join(LOG_DIRECTORY, entry.name)));

  await Promise.all(deletions);
}

function prepareDailyChannel(day: string): Promise<void> {
  if (preparedLogDay === day && prepareLogDirectoryPromise) {
    return prepareLogDirectoryPromise;
  }

  preparedLogDay = day;
  prepareLogDirectoryPromise = mkdir(LOG_DIRECTORY, { recursive: true }).then(async () => {
    try {
      await deleteExpiredLogFiles(day);
    } catch (cause) {
      process.stderr.write(`log retention failed: ${cause instanceof Error ? redactText(cause.message) : redactText(String(cause))}\n`);
    }
  });

  return prepareLogDirectoryPromise;
}

function toSingleLine(message: string): string {
  const collapsed = redactText(message).replace(/\s+/g, ' ').trim();

  return collapsed.length > MAX_MESSAGE_CHARACTERS ? `${collapsed.slice(0, MAX_MESSAGE_CHARACTERS)}…` : collapsed;
}

function formatDetails(details: Record<string, unknown>): string {
  const pairs = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);

  return pairs.length > 0 ? ` | ${pairs.join(' ')}` : '';
}

function getOwnStack(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const stack = (error as { stack?: unknown }).stack;

  return typeof stack === 'string' ? redactText(stack) : undefined;
}

function getStack(error: unknown): string | undefined {
  const stacks: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth <= MAX_CAUSE_DEPTH && current !== undefined && current !== null; depth += 1) {
    const stack = getOwnStack(current);

    if (stack) {
      stacks.push(depth === 0 ? stack : `caused by: ${stack}`);
    }

    current = (current as { cause?: unknown }).cause;
  }

  return stacks.length > 0 ? stacks.join('\n').slice(0, MAX_STACK_CHARACTERS) : undefined;
}

function formatStackBlock(stack: string | undefined): string {
  if (!stack) {
    return '';
  }

  return `\n${stack
    .split('\n')
    .map((line) => `${STACK_INDENT}${line.trim()}`)
    .join('\n')}`;
}

function writeToDailyFile(time: string, entry: string): void {
  const day = getUtcDay(time);

  void prepareDailyChannel(day)
    .then(() => appendFile(getLogFilePath(day), entry, 'utf8'))
    .catch((cause: unknown) => {
      process.stderr.write(`log write failed: ${cause instanceof Error ? redactText(cause.message) : redactText(String(cause))}\n`);
    });
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}): void {
  if (LOG_LEVEL_RANK[level] < LOG_LEVEL_RANK[loggerConfig.level]) {
    return;
  }

  const time = new Date().toISOString();
  const { error, ...rest } = context;
  const details = redactValue(rest) as Record<string, unknown>;
  const stack = getStack(error);
  const safeMessage = toSingleLine(message);
  const readableEntry = `[${time}] ${level.toUpperCase()} ${safeMessage}${formatDetails(details)}${formatStackBlock(stack)}\n`;
  const structuredEntry = `${JSON.stringify({ level, time, message: safeMessage, ...details, ...(stack ? { stack } : {}) })}\n`;

  if (loggerConfig.channel === 'daily' || loggerConfig.channel === 'stack') {
    writeToDailyFile(time, readableEntry);
  }

  if (loggerConfig.channel === 'stdout' || loggerConfig.channel === 'stack') {
    process.stdout.write(loggerConfig.channel === 'stdout' ? structuredEntry : readableEntry);
  }
}

export function logDebug(message: string, context?: LogContext): void {
  writeLog('debug', message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  writeLog('info', message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  writeLog('warn', message, context);
}

export function logError(message: string, context?: LogContext): void {
  writeLog('error', message, context);
}

export function logFatal(message: string, context?: LogContext): void {
  writeLog('fatal', message, context);
}
