import { describe, expect, test } from 'vitest';
import { applyDayShift, buildTimeline, isWeekend, monthSegments, readableTextColor, toDayNumber, toIsoDate, todayDayNumber } from '@/utils/plan-dates';

describe('plan dates', () => {
  test('round-trips calendar dates through day numbers, across month and year ends', () => {
    expect(toDayNumber('1970-01-02')).toBe(1);
    expect(toIsoDate(toDayNumber('2026-12-31') + 1)).toBe('2027-01-01');
    expect(toIsoDate(toDayNumber('2028-02-28') + 1)).toBe('2028-02-29');
  });

  test('rejects text that is not a calendar date', () => {
    expect(() => toDayNumber('22/10/2026')).toThrow(RangeError);
  });

  test('reads today from the local calendar, not from UTC', () => {
    expect(toIsoDate(todayDayNumber(new Date(2026, 9, 22, 23, 30)))).toBe('2026-10-22');
  });

  test('marks Saturday and Sunday as weekend', () => {
    expect(isWeekend(toDayNumber('2026-10-24'))).toBe(true);
    expect(isWeekend(toDayNumber('2026-10-25'))).toBe(true);
    expect(isWeekend(toDayNumber('2026-10-26'))).toBe(false);
  });

  test('moves both ends, or one end without crossing the other', () => {
    const range = { start: 10, end: 14 };

    expect(applyDayShift(range, 'move', -3)).toEqual({ start: 7, end: 11 });
    expect(applyDayShift(range, 'end', 2)).toEqual({ start: 10, end: 16 });
    expect(applyDayShift(range, 'end', -9)).toEqual({ start: 10, end: 10 });
    expect(applyDayShift(range, 'start', 9)).toEqual({ start: 14, end: 14 });
  });

  test('pads the window around every task and today, and is empty without either', () => {
    expect(buildTimeline([{ start: 10, end: 20 }], 30)).toEqual({ start: 7, end: 40 });
    expect(buildTimeline([], 30, { before: 0, after: 0 })).toEqual({ start: 30, end: 30 });
    expect(buildTimeline([], null)).toBeNull();
  });

  test('splits the window into months', () => {
    const start = toDayNumber('2026-10-30');

    expect(monthSegments({ start, end: start + 3 })).toEqual([
      { key: '2026-10', year: 2026, month: 10, startOffset: 0, length: 2 },
      { key: '2026-11', year: 2026, month: 11, startOffset: 2, length: 2 },
    ]);
  });

  test('picks the more readable text colour for a bar', () => {
    expect(readableTextColor('#0f766e')).toBe('#ffffff');
    expect(readableTextColor('#ca8a04')).toBe('#14171c');
    expect(readableTextColor('#ffffff')).toBe('#14171c');
  });
});
