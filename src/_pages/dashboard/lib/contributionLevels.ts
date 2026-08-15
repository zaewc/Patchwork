import type { CalendarDay } from "@/entities/contribution";

/** 색을 입히는 단계. 0은 기여 없음. */
export type PatchLevel = 0 | 1 | 2 | 3 | 4;

/**
 * 기여 수를 4단계로 나누는 함수를 만든다.
 *
 * 절대 기준(예: 5건 이상은 진하게)을 쓰면 활동량이 적은 사람의 달력은 전부 옅고
 * 많은 사람의 달력은 전부 진해진다. 그래서 그 사람의 기여 분포 안에서 사분위로 가른다.
 */
export function contributionLevels(
  days: CalendarDay[],
): (count: number) => PatchLevel {
  const active = days
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  if (active.length === 0) return () => 0;

  const at = (ratio: number) =>
    active[Math.min(active.length - 1, Math.floor(active.length * ratio))]!;
  const [first, second, third] = [at(0.25), at(0.5), at(0.75)];

  return (count) => {
    if (count <= 0) return 0;
    if (count <= first) return 1;
    if (count <= second) return 2;
    if (count <= third) return 3;
    return 4;
  };
}
