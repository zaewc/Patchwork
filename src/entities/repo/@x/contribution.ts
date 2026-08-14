/**
 * entities/contribution 만을 위한 공개 API ("repo crossed with contribution").
 *
 * 기여는 언제나 어떤 repository에 쌓인다. 그래서 기여를 repository별로 합치면서
 * 그 repository의 권위 점수를 함께 매긴다.
 * @see https://feature-sliced.design/docs/reference/public-api#cross-imports
 */

export { repoSignalsOf, scoreRepo, REPO_COUNT_FIELDS } from "@/entities/repo";
export type { RepoCountField, RepoStat } from "@/entities/repo";
