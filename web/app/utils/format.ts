export function formatCurrencyAmount(amount: number, currencyCode: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
}

// A fixed zone keeps the server-rendered text identical to the hydrated text for every visitor.
const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function formatDisplayDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: DISPLAY_TIME_ZONE }).format(new Date(isoDate));
}

export function formatDisplayDateTime(isoDateTime: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: DISPLAY_TIME_ZONE }).format(new Date(isoDateTime));
}

/** "5 minutes ago", "yesterday"… for recent moments; older ones show the date. */
export function formatTimeAgo(isoDateTime: string, locale: string, now = Date.now()): string {
  const seconds = Math.round((new Date(isoDateTime).getTime() - now) / 1_000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
  ];
  let value = seconds;

  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) {
      return format.format(unit === 'second' ? 0 : value, unit === 'second' ? 'minute' : unit);
    }
    value = Math.round(value / size);
  }

  return formatDisplayDate(isoDateTime.slice(0, 10), locale);
}
