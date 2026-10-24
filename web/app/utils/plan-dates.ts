/**
 * Plan dates are calendar days without a time zone (`YYYY-MM-DD`). The Gantt chart works on whole
 * "day numbers" (days since 1970-01-01, UTC) so moving a bar is integer arithmetic and never shifts a
 * date across a time-zone boundary.
 */
const DAY_MILLISECONDS = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DayRange {
  start: number;
  end: number;
}

export function toDayNumber(isoDate: string): number {
  const match = ISO_DATE_PATTERN.exec(isoDate);

  if (!match) {
    throw new RangeError(`Invalid plan date: ${isoDate}`);
  }

  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MILLISECONDS);
}

export function toIsoDate(day: number): string {
  return new Date(day * DAY_MILLISECONDS).toISOString().slice(0, 10);
}

/** Today in the reader's own calendar, not in UTC. */
export function todayDayNumber(now: Date = new Date()): number {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MILLISECONDS);
}

export function isWeekend(day: number): boolean {
  const weekday = new Date(day * DAY_MILLISECONDS).getUTCDay();

  return weekday === 0 || weekday === 6;
}

export function dayOfMonth(day: number): number {
  return new Date(day * DAY_MILLISECONDS).getUTCDate();
}

/** Inclusive length, so a one-day task has a duration of 1. */
export function durationInDays(range: DayRange): number {
  return range.end - range.start + 1;
}

/**
 * Applies a drag to a task. Moving shifts both ends; resizing moves one end and never lets the task
 * end before it starts.
 */
export function applyDayShift(range: DayRange, mode: 'move' | 'start' | 'end', delta: number): DayRange {
  if (mode === 'move') {
    return { start: range.start + delta, end: range.end + delta };
  }
  if (mode === 'start') {
    return { start: Math.min(range.start + delta, range.end), end: range.end };
  }

  return { start: range.start, end: Math.max(range.end + delta, range.start) };
}

/** The visible window: every task plus some air on both sides, and today when it is close by. */
export function buildTimeline(ranges: DayRange[], today: number | null, padding = { before: 3, after: 10 }): DayRange | null {
  const starts = ranges.map((range) => range.start);
  const ends = ranges.map((range) => range.end);

  if (today !== null) {
    starts.push(today);
    ends.push(today);
  }
  if (!starts.length) {
    return null;
  }

  return { start: Math.min(...starts) - padding.before, end: Math.max(...ends) + padding.after };
}

export interface MonthSegment {
  key: string;
  year: number;
  /** 1-12. */
  month: number;
  startOffset: number;
  length: number;
}

export function monthSegments(timeline: DayRange): MonthSegment[] {
  const segments: MonthSegment[] = [];

  for (let day = timeline.start; day <= timeline.end; day += 1) {
    const date = new Date(day * DAY_MILLISECONDS);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const last = segments.at(-1);

    if (last && last.year === year && last.month === month) {
      last.length += 1;
    } else {
      segments.push({ key: `${year}-${month}`, year, month, startOffset: day - timeline.start, length: 1 });
    }
  }

  return segments;
}

/** Black or white text, whichever reads better on a stage color (WCAG relative luminance). */
export function readableTextColor(hexColor: string): '#ffffff' | '#14171c' {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hexColor.slice(index, index + 2), 16) / 255;

    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);

  // Contrast with white is (1.05)/(L+0.05); with near-black it is (L+0.05)/(0.05+~0.008).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.058 ? '#ffffff' : '#14171c';
}
