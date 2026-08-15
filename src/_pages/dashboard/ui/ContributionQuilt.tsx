import { contributionLevels } from "@/_pages/dashboard/lib/contribution-levels";
import type { CalendarDay } from "@/entities/contribution";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

/** 5년치(약 260주)를 12px 셀로 그리면 4,000px가 넘는다. 긴 기간은 셀을 줄인다. */
const DENSE_AFTER_WEEKS = 60;

export function ContributionQuilt({ weeks }: { weeks: CalendarDay[][] }) {
  const level = contributionLevels(weeks.flat());

  const dense = weeks.length > DENSE_AFTER_WEEKS;
  const cell = dense ? 8 : 12;
  const gap = dense ? 2 : 3;
  const step = cell + gap;
  const cellClass = dense ? "quilt-cell-dense" : "quilt-cell";

  // 주 단위 격자를 요일 슬롯(0~6)에 맞춰 정렬한다. 첫/마지막 주는 비어 있을 수 있다.
  const grid = weeks.map((week) => {
    const slots: (CalendarDay | null)[] = Array.from({ length: 7 }, () => null);
    for (const day of week) slots[day.weekday] = day;
    return slots;
  });

  const labels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  grid.forEach((week, index) => {
    const first = week.find(Boolean);
    if (!first) return;
    const date = new Date(first.date);
    const month = date.getUTCMonth();
    // 마지막 주에 라벨을 붙이면 격자 밖으로 삐져 나간다.
    if (month === lastMonth || index >= grid.length - 1) return;
    lastMonth = month;
    // 조밀한 모드에서는 1월(연 경계)에만 연도를 찍는다.
    if (dense && month !== 0) return;
    labels.push({
      index,
      label: dense ? String(date.getUTCFullYear()) : MONTHS[month]!,
    });
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block min-w-full">
        <div className="flex gap-2">
          <div className="w-7 shrink-0" />
          <div className="relative h-4" style={{ width: grid.length * step }}>
            {labels.map(({ index, label }) => (
              <span
                key={`${label}-${index}`}
                className="absolute top-0 text-[10px] text-muted"
                style={{ left: index * step }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div
            className="grid w-7 shrink-0 text-[10px] text-muted"
            style={{ gridTemplateRows: `repeat(7, ${cell}px)`, rowGap: gap }}
          >
            {Array.from({ length: 7 }, (_, weekday) => (
              <span key={weekday} style={{ lineHeight: `${cell}px` }}>
                {WEEKDAY_LABELS[weekday] ?? ""}
              </span>
            ))}
          </div>

          <div
            className="grid grid-flow-col"
            style={{
              gridTemplateRows: `repeat(7, ${cell}px)`,
              gap,
              width: grid.length * step,
            }}
          >
            {grid.map((week, weekIndex) =>
              week.map((day, weekday) =>
                day ? (
                  <span
                    key={day.date}
                    title={`${day.date} · ${day.count} contributions`}
                    className={`patch-${level(day.count)} ${cellClass}`}
                  />
                ) : (
                  <span key={`${weekIndex}-${weekday}`} className={cellClass} />
                ),
              ),
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 pl-9 text-[11px] text-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((patch) => (
            <span key={patch} className={`patch-${patch} ${cellClass}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
