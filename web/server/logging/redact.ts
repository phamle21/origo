const REDACTED = '[redacted]';
const TRUNCATED = '[truncated]';

const SENSITIVE_KEY_PATTERN = /authorization|cookie|token|secret|password|passphrase|credential|session|api[-_]?key|card|cvv|otp|email|phone/i;

const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 1_024;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 40;

const SENSITIVE_ASSIGNMENT_PATTERN =
  /\b(authorization|cookie|token|secret|password|passphrase|credential|session(?:id)?|api[-_]?key|card|cvv|otp)\b\s*[:=]\s*(?:Bearer\s+[A-Za-z0-9._~+/=-]+|"[^"]*"|'[^']*'|[^\s,;]+)/gi;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /https?:\/\/[^\s<>'"`]+/gi;

function redactUrlQuery(value: string): string {
  try {
    const url = new URL(value);

    return `${url.origin}${url.pathname}${url.search ? '?[redacted]' : ''}${url.hash ? '#[redacted]' : ''}`;
  } catch {
    return '[invalid-url]';
  }
}

export function redactText(value: string): string {
  return value
    .replace(URL_PATTERN, redactUrlQuery)
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]')
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, '$1=[redacted]')
    .replace(EMAIL_PATTERN, REDACTED);
}

export function toSafeLogUrl(value: string): string {
  return redactUrlQuery(value);
}

function redactString(value: string): string {
  const redacted = redactText(value);

  return redacted.length > MAX_STRING_LENGTH ? `${redacted.slice(0, MAX_STRING_LENGTH)}…${TRUNCATED}` : redacted;
}

/**
 * Returns a bounded copy of `value` with sensitive keys replaced. Log writers must pass every
 * caller-supplied value through this function; it is the only place redaction is defined.
 */
export function redactValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  if (depth >= MAX_DEPTH) {
    return TRUNCATED;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redactValue(item, depth + 1));

    return value.length > MAX_ARRAY_ITEMS ? [...items, TRUNCATED] : items;
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactValue(entry, depth + 1);
  }

  return redacted;
}
