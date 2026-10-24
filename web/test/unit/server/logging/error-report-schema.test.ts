import { describe, expect, test } from 'vitest';
import { clientErrorReportSchema } from '~~/server/logging/error-report-schema';
import { CLIENT_ERROR_REPORT_LIMITS } from '~~/shared/logging/error-report';

const validReport = {
  message: 'Cannot read properties of undefined',
  source: 'vue',
  severity: 'error',
  url: 'https://babyface.local/',
  occurredAt: '2026-08-10T00:00:00.000Z',
};

describe('clientErrorReportSchema', () => {
  test('accepts a minimal report', () => {
    expect(clientErrorReportSchema.parse(validReport)).toMatchObject(validReport);
  });

  test('accepts a message at the exact limit and rejects one character more', () => {
    const atLimit = 'x'.repeat(CLIENT_ERROR_REPORT_LIMITS.messageLength);

    expect(clientErrorReportSchema.safeParse({ ...validReport, message: atLimit }).success).toBe(true);
    expect(clientErrorReportSchema.safeParse({ ...validReport, message: `${atLimit}x` }).success).toBe(false);
  });

  test('rejects an empty message', () => {
    expect(clientErrorReportSchema.safeParse({ ...validReport, message: '   ' }).success).toBe(false);
  });

  test('rejects an unknown source and an unknown severity', () => {
    expect(clientErrorReportSchema.safeParse({ ...validReport, source: 'worker' }).success).toBe(false);
    expect(clientErrorReportSchema.safeParse({ ...validReport, severity: 'info' }).success).toBe(false);
  });

  test('rejects a timestamp that is not ISO-8601', () => {
    expect(clientErrorReportSchema.safeParse({ ...validReport, occurredAt: '10/08/2026' }).success).toBe(false);
  });

  test('rejects an unknown key so the payload stays bounded', () => {
    expect(clientErrorReportSchema.safeParse({ ...validReport, cookies: 'session=1' }).success).toBe(false);
  });

  test('rejects a stack beyond its limit', () => {
    const oversizedStack = 'x'.repeat(CLIENT_ERROR_REPORT_LIMITS.stackLength + 1);

    expect(clientErrorReportSchema.safeParse({ ...validReport, stack: oversizedStack }).success).toBe(false);
  });
});
