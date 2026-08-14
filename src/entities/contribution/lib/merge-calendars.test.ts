import { describe, expect, it } from "vitest";
import { mergeCalendars } from "@/entities/contribution/lib/merge-calendars";
import { calendarWeeks, collection } from "@/shared/api/github/response.fixtures";

const calendar = (startDate: string, counts: number[]) =>
  collection({
    contributionCalendar: {
      totalContributions: counts.reduce((sum, count) => sum + count, 0),
      weeks: calendarWeeks(startDate, counts),
    },
  });

describe("mergeCalendars", () => {
  it("날짜별 기여 수를 그대로 옮긴다", () => {
    // 2026-08-09는 일요일이다.
    const weeks = mergeCalendars([calendar("2026-08-09", [1, 2, 3])]);

    expect(weeks).toEqual([
      [
        { date: "2026-08-09", count: 1, weekday: 0 },
        { date: "2026-08-10", count: 2, weekday: 1 },
        { date: "2026-08-11", count: 3, weekday: 2 },
      ],
    ]);
  });

  it("일요일마다 새 주를 시작한다", () => {
    const weeks = mergeCalendars([calendar("2026-08-09", Array.from({ length: 15 }, () => 0))]);

    expect(weeks.map((week) => week.length)).toEqual([7, 7, 1]);
    expect(weeks.map((week) => week[0]!.weekday)).toEqual([0, 0, 0]);
  });

  it("일요일이 아닌 날부터 시작해도 첫 주를 만든다", () => {
    const weeks = mergeCalendars([calendar("2026-08-12", [0, 0, 0, 0, 0])]);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toHaveLength(4);
    expect(weeks[0]![0]!.weekday).toBe(3);
  });

  it("창 경계에서 겹친 날짜는 하나로 합친다", () => {
    const shared = calendar("2026-08-09", [1, 2, 3]);
    const weeks = mergeCalendars([shared, shared]);

    expect(weeks.flat()).toHaveLength(3);
    expect(weeks.flat().reduce((sum, day) => sum + day.count, 0)).toBe(6);
  });

  it("날짜순으로 다시 줄 세운다", () => {
    const weeks = mergeCalendars([calendar("2026-08-16", [4]), calendar("2026-08-09", [1])]);

    expect(weeks.flat().map((day) => day.date)).toEqual(["2026-08-09", "2026-08-16"]);
  });

  it("달력이 비어 있으면 빈 배열이다", () => {
    expect(mergeCalendars([collection()])).toEqual([]);
    expect(mergeCalendars([])).toEqual([]);
  });
});
