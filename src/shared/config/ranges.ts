/** 대시보드가 다루는 조회 범위. 화면 라벨과 일수를 한 곳에서 정한다. */

export const RANGES = {
  "30d": { label: "30일", days: 30 },
  "90d": { label: "90일", days: 90 },
  "1y": { label: "1년", days: 365 },
  "5y": { label: "5년", days: 365 * 5 },
} as const;

export type RangeKey = keyof typeof RANGES;

export function parseRange(value: unknown): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "1y";
}

/** GitHub의 contributionsCollection은 한 번에 1년까지만 돌려준다. */
const MAX_WINDOW_DAYS = 365;
const DAY_MS = 86_400_000;

/**
 * 조회 범위를 1년 이하의 창으로 쪼갠다. 과거에서 현재 순서이고, 창 사이에
 * 1ms만 두어 기간에 구멍이 생기지 않게 한다.
 */
export function windowsFor(range: RangeKey, now: number): { from: Date; to: Date }[] {
  const windows: { from: Date; to: Date }[] = [];
  let end = now;
  let remaining = RANGES[range].days;

  while (remaining > 0) {
    const span = Math.min(remaining, MAX_WINDOW_DAYS);
    const start = end - span * DAY_MS;
    windows.push({ from: new Date(start), to: new Date(end) });
    end = start - 1;
    remaining -= span;
  }

  return windows.reverse();
}

/** 조회 범위가 시작하는 날짜(YYYY-MM-DD). GitHub 검색 한정자에 그대로 넣는다. */
export function rangeStartDate(range: RangeKey, now: number): string {
  return windowsFor(range, now)[0]!.from.toISOString().slice(0, 10);
}
