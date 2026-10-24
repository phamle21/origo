import { describe, expect, test } from 'vitest';
import { redactText, redactValue, toSafeLogUrl } from '~~/server/logging/redact';

describe('redactValue', () => {
  test('replaces sensitive keys at any depth', () => {
    const redacted = redactValue({
      requestId: 'request-1',
      authorization: 'Bearer token',
      user: { email: 'someone@example.com', sessionId: 'abc', displayName: 'Someone' },
    });

    expect(redacted).toEqual({
      requestId: 'request-1',
      authorization: '[redacted]',
      user: { email: '[redacted]', sessionId: '[redacted]', displayName: 'Someone' },
    });
  });

  test('reduces an error to its name and message', () => {
    expect(redactValue(new TypeError('bad input'))).toEqual({ name: 'TypeError', message: 'bad input' });
  });

  test('truncates a long string', () => {
    const redacted = redactValue('x'.repeat(1_100));

    expect(String(redacted)).toHaveLength(1_024 + '…[truncated]'.length);
  });

  test('bounds an array and marks the cut', () => {
    const redacted = redactValue(Array.from({ length: 25 }, (_, index) => index)) as unknown[];

    expect(redacted).toHaveLength(21);
    expect(redacted.at(-1)).toBe('[truncated]');
  });

  test('stops recursing past the depth bound', () => {
    const redacted = redactValue({ a: { b: { c: { d: { e: 'deep' } } } } }) as Record<string, unknown>;

    expect(redacted).toEqual({ a: { b: { c: { d: '[truncated]' } } } });
  });

  test('keeps primitives untouched', () => {
    expect(redactValue({ count: 3, isEnabled: false, missing: null })).toEqual({ count: 3, isEnabled: false, missing: null });
  });

  test('redacts credentials and personal data embedded in text', () => {
    const redacted = redactText('authorization: Bearer abc123 email=user@example.com token=secret');

    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('user@example.com');
    expect(redacted).not.toContain('secret');
  });

  test('removes query values and fragments from logged URLs', () => {
    expect(toSafeLogUrl('https://shop.example.test/reset?token=secret#form')).toBe('https://shop.example.test/reset?[redacted]#[redacted]');
    expect(toSafeLogUrl('not a url')).toBe('[invalid-url]');
  });
});
