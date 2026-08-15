import { isNotable } from "@/entities/repo";

/**
 * 주요 OSS 모드에서는 권위 점수가 기준선을 넘은 것만 남긴다.
 * 화면의 세 목록이 모두 같은 기준을 쓰게 하려고 한 곳에 둔다.
 */
export function filterByScope<T extends { impact: number }>(
  items: T[],
  showAll: boolean,
): T[] {
  return showAll ? items : items.filter((item) => isNotable(item.impact));
}
