import { loadScorecards } from "@/entities/repo";

/**
 * JSON으로 오갈 수 있는 점수표. `Map`은 직렬화되지 않으므로 쌍의 배열로 옮긴다.
 * null은 "deps.dev가 그 repository를 모른다"는 뜻이다.
 */
export type ImpactEntries = [string, number | null][];

/**
 * 한 번에 물을 수 있는 repository 수의 상한.
 *
 * 목록을 브라우저가 만들어 보내므로 그대로 믿으면 요청 하나가 바깥으로 수천 번 나갈 수
 * 있다. 5년 범위에서 기여 repository와 PR이 가리키는 곳을 모두 합친 현실적인 최대치보다
 * 넉넉하게 잡고, 넘으면 조용히 자르지 않고 거절한다.
 */
export const MAX_IMPACT_KEYS = 1_500;

/** 화면이 받아 갈 모양으로 점수표를 만든다. */
export async function loadImpact(keys: string[]): Promise<ImpactEntries> {
  return [...(await loadScorecards(keys))];
}
