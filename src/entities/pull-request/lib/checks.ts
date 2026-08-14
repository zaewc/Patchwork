import type { CheckState } from "@/entities/pull-request/model/types";

/**
 * CI 결과를 사용자에게 보여줄 문구로 옮긴다. 목록에 없는 상태(EXPECTED 등)는
 * 아직 아무 일도 일어나지 않은 것이라 굳이 알리지 않는다.
 */
const LABELS: Partial<Record<NonNullable<CheckState>, { text: string; tone: string }>> = {
  SUCCESS: { text: "Checks passed", tone: "text-ok" },
  FAILURE: { text: "Checks failed", tone: "text-danger" },
  ERROR: { text: "Checks failed", tone: "text-danger" },
  PENDING: { text: "Checks pending", tone: "text-warn" },
};

export function checkLabelOf(state: CheckState) {
  return state ? LABELS[state] : undefined;
}
