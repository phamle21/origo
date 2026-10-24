import { describe, expect, test } from 'vitest';
import { formatCurrencyAmount, formatDisplayDate, formatDisplayDateTime } from '@/utils/format';

describe('formatCurrencyAmount', () => {
  test('applies the decimal rules of the currency', () => {
    expect(formatCurrencyAmount(1_250, 'JPY')).toContain('1,250');
    expect(formatCurrencyAmount(12.5, 'USD')).toContain('12.50');
  });

  test('formats zero without falling back to an empty string', () => {
    expect(formatCurrencyAmount(0, 'USD')).toContain('0.00');
  });

  test('honours the requested locale', () => {
    expect(formatCurrencyAmount(1_250, 'JPY', 'ja')).toContain('1,250');
  });
});

describe('display dates', () => {
  test('format in the team time zone so server and browser render the same text', () => {
    // 23:30 UTC is already the next day in Asia/Ho_Chi_Minh.
    expect(formatDisplayDate('2026-10-20T23:30:00Z', 'en')).toBe('Oct 21, 2026');
    expect(formatDisplayDateTime('2026-10-21T07:10:00Z', 'en')).toBe('Oct 21, 2026, 2:10 PM');
  });
});
