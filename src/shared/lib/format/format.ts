const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 시간 표기에 필요한 것. 눈금 이름(분·시간·일…)은 Intl이 언어별로 알고 있고,
 * 1분이 안 된 순간에 쓸 말만 사전에서 받는다.
 */
export type TimeFormat = { locale: string; justNow: string };

export function relativeTime(
  iso: string,
  format: TimeFormat,
  now: number = Date.now(),
): string {
  const diff = now - new Date(iso).getTime();
  if (diff < MINUTE) return format.justNow;

  const relative = new Intl.RelativeTimeFormat(format.locale, {
    numeric: "always",
  });
  if (diff < HOUR) return relative.format(-Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return relative.format(-Math.floor(diff / HOUR), "hour");

  const days = Math.floor(diff / DAY);
  if (days < 30) return relative.format(-days, "day");
  if (days < 365) return relative.format(-Math.floor(days / 30), "month");
  return relative.format(-Math.floor(days / 365), "year");
}

export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

export function shortDate(iso: string): string {
  return iso.slice(2, 10);
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
