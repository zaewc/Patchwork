import type {
  CalendarDay,
  ContributionsCollection,
} from "@/entities/contribution/model/types";

/**
 * 여러 조회 창의 달력을 하나로 잇는다. 창 경계의 주는 양쪽에 걸쳐 들어오므로
 * 날짜로 중복을 제거한 뒤 일요일 기준으로 다시 주 단위로 묶는다.
 */
export function mergeCalendars(
  collections: ContributionsCollection[],
): CalendarDay[][] {
  const byDate = new Map<string, CalendarDay>();
  for (const collection of collections) {
    for (const week of collection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        byDate.set(day.date, {
          date: day.date,
          count: day.contributionCount,
          weekday: day.weekday,
        });
      }
    }
  }

  const days = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks: CalendarDay[][] = [];
  for (const day of days) {
    let week = weeks.at(-1);
    if (!week || day.weekday === 0) {
      week = [];
      weeks.push(week);
    }
    week.push(day);
  }
  return weeks;
}
