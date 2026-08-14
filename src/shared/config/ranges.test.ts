import { describe, expect, it } from "vitest";
import { parseRange, RANGES, rangeStartDate, windowsFor } from "@/shared/config/ranges";

const NOW = Date.parse("2026-08-15T00:00:00Z");
const DAY = 86_400_000;

describe("parseRange", () => {
  it.each(Object.keys(RANGES))("아는 값 %s 은 그대로 통과한다", (key) => {
    expect(parseRange(key)).toBe(key);
  });

  it.each([["10y"], [""], [null], [undefined], [30], [{ range: "30d" }], [["30d"]]])(
    "모르는 값 %s 은 1y로 떨어진다",
    (value) => {
      expect(parseRange(value)).toBe("1y");
    },
  );
});

describe("windowsFor", () => {
  it("1년 이하 범위는 창 하나로 끝난다", () => {
    for (const range of ["30d", "90d", "1y"] as const) {
      const windows = windowsFor(range, NOW);
      expect(windows).toHaveLength(1);
      expect(windows[0].to.getTime()).toBe(NOW);
      expect(windows[0].from.getTime()).toBe(NOW - RANGES[range].days * DAY);
    }
  });

  it("5년은 1년짜리 창 5개로 쪼갠다", () => {
    const windows = windowsFor("5y", NOW);
    expect(windows).toHaveLength(5);
    for (const window of windows) {
      expect(window.to.getTime() - window.from.getTime()).toBe(365 * DAY);
    }
  });

  it("창은 과거에서 현재 순서이고 서로 겹치지 않는다", () => {
    const windows = windowsFor("5y", NOW);
    expect(windows.at(-1)!.to.getTime()).toBe(NOW);

    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].from.getTime()).toBeGreaterThan(windows[i - 1].to.getTime());
      // 앞 창의 끝과 뒤 창의 시작이 1ms만 떨어져 있어야 기간에 구멍이 없다.
      expect(windows[i].from.getTime() - windows[i - 1].to.getTime()).toBe(1);
    }
  });

  it("전체 범위가 요청한 일수를 덮는다", () => {
    const windows = windowsFor("5y", NOW);
    const covered = windows.at(-1)!.to.getTime() - windows[0].from.getTime();
    expect(covered).toBe(RANGES["5y"].days * DAY + (windows.length - 1));
  });
});

describe("rangeStartDate", () => {
  it("가장 오래된 창의 시작 날짜를 YYYY-MM-DD로 준다", () => {
    expect(rangeStartDate("30d", NOW)).toBe("2026-07-16");
    expect(rangeStartDate("1y", NOW)).toBe("2025-08-15");
  });

  it("5년은 첫 창의 시작을 가리킨다", () => {
    expect(rangeStartDate("5y", NOW)).toBe(
      windowsFor("5y", NOW)[0].from.toISOString().slice(0, 10),
    );
  });
});
