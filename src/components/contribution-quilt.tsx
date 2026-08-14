import type { CalendarDay } from "@/lib/github";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

function levelsFrom(days: CalendarDay[]): (count: number) => number {
  const active = days
    .map((d) => d.count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  if (active.length === 0) return () => 0;

  const at = (p: number) => active[Math.min(active.length - 1, Math.floor(active.length * p))];
  const [t1, t2, t3] = [at(0.25), at(0.5), at(0.75)];

  return (count: number) => {
    if (count <= 0) return 0;
    if (count <= t1) return 1;
    if (count <= t2) return 2;
    if (count <= t3) return 3;
    return 4;
  };
}

export function ContributionQuilt({ weeks }: { weeks: CalendarDay[][] }) {
  const level = levelsFrom(weeks.flat());

  // 5년치(약 260주)를 12px 셀로 그리면 4,000px가 넘는다. 긴 기간은 셀을 줄이고
  // 월 이름 대신 연도만 찍는다.
  const dense = weeks.length > 60;
  const CELL = dense ? 8 : 12;
  const GAP = dense ? 2 : 3;
  const STEP = CELL + GAP;

  // 주 단위 격자를 요일 슬롯(0~6)에 맞춰 정렬한다. 첫/마지막 주는 비어 있을 수 있다.
  const grid = weeks.map((week) => {
    const slots: (CalendarDay | null)[] = Array.from({ length: 7 }, () => null);
    for (const day of week) slots[day.weekday] = day;
    return slots;
  });

  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;
  grid.forEach((week, index) => {
    const first = week.find(Boolean);
    if (!first) return;
    const date = new Date(first.date);
    const month = date.getUTCMonth();
    if (month === lastMonth || index >= grid.length - 1) return;
    // 조밀한 모드에서는 1월(연 경계)에만 연도를 찍는다.
    if (dense && month !== 0) {
      lastMonth = month;
      return;
    }
    monthLabels.push({ index, label: dense ? String(date.getUTCFullYear()) : MONTHS[month] });
    lastMonth = month;
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block min-w-full">
        <div className="flex gap-2">
          <div className="w-7 shrink-0" />
          <div className="relative h-4" style={{ width: grid.length * STEP }}>
            {monthLabels.map(({ index, label }) => (
              <span
                key={`${label}-${index}`}
                className="absolute top-0 text-[10px] text-muted"
                style={{ left: index * STEP }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div
            className="grid w-7 shrink-0 text-[10px] text-muted"
            style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}
          >
            {Array.from({ length: 7 }, (_, weekday) => (
              <span key={weekday} style={{ lineHeight: `${CELL}px` }}>
                {WEEKDAY_LABELS[weekday] ?? ""}
              </span>
            ))}
          </div>

          <div
            className="grid grid-flow-col"
            style={{
              gridTemplateRows: `repeat(7, ${CELL}px)`,
              gap: GAP,
              width: grid.length * STEP,
            }}
          >
            {grid.map((week, weekIndex) =>
              week.map((day, weekday) =>
                day ? (
                  <span
                    key={day.date}
                    title={`${day.date} · ${day.count} contributions`}
                    className={`patch-${level(day.count)} ${dense ? "rounded-[1px]" : "rounded-xs"}`}
                    style={{ width: CELL, height: CELL }}
                  />
                ) : (
                  <span key={`${weekIndex}-${weekday}`} style={{ width: CELL, height: CELL }} />
                ),
              ),
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 pl-9 text-[11px] text-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={`patch-${l} rounded-xs`}
              style={{ width: CELL, height: CELL }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
