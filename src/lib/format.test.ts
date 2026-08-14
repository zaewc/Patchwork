import { describe, expect, it } from "vitest";
import { daysSince, formatNumber, percent, relativeTime, shortDate } from "@/lib/format";

const NOW = Date.parse("2026-08-15T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it.each([
    ["1분 미만", 30 * SECOND, "방금 전"],
    ["1분 경계", MINUTE, "1분 전"],
    ["분 단위", 59 * MINUTE, "59분 전"],
    ["1시간 경계", HOUR, "1시간 전"],
    ["시간 단위", 23 * HOUR, "23시간 전"],
    ["1일 경계", DAY, "1일 전"],
    ["일 단위", 29 * DAY, "29일 전"],
    ["30일 경계", 30 * DAY, "1개월 전"],
    ["개월 단위", 364 * DAY, "12개월 전"],
    ["1년 경계", 365 * DAY, "1년 전"],
    ["년 단위", 3 * 365 * DAY, "3년 전"],
  ])("%s", (_label, diff, expected) => {
    expect(relativeTime(ago(diff), NOW)).toBe(expected);
  });

  it("미래 시각은 방금 전으로 본다", () => {
    expect(relativeTime(new Date(NOW + DAY).toISOString(), NOW)).toBe("방금 전");
  });

  it("now를 생략하면 현재 시각을 쓴다", () => {
    expect(relativeTime(new Date().toISOString())).toBe("방금 전");
  });
});

describe("daysSince", () => {
  it("경과 일수를 내림한다", () => {
    expect(daysSince(ago(0), NOW)).toBe(0);
    expect(daysSince(ago(DAY - 1), NOW)).toBe(0);
    expect(daysSince(ago(14 * DAY), NOW)).toBe(14);
  });

  it("now를 생략하면 현재 시각을 쓴다", () => {
    expect(daysSince(new Date().toISOString())).toBe(0);
  });
});

describe("formatNumber", () => {
  it("천 단위 구분자를 넣는다", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("shortDate", () => {
  it("ISO 날짜를 YY-MM-DD로 자른다", () => {
    expect(shortDate("2026-08-15T12:00:00Z")).toBe("26-08-15");
    expect(shortDate("2026-08-15")).toBe("26-08-15");
  });
});

describe("percent", () => {
  it("비율을 반올림한다", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(2, 3)).toBe(67);
    expect(percent(5, 5)).toBe(100);
  });

  it("분모가 0 이하면 0을 준다", () => {
    expect(percent(5, 0)).toBe(0);
    expect(percent(5, -1)).toBe(0);
  });
});
