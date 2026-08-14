/**
 * entities/contribution 만을 위한 공개 API ("repo crossed with contribution").
 *
 * 기여는 언제나 어떤 repository에 쌓인다. 그래서 기여를 repository별로 합치면서
 * 나중에 점수를 매길 꼬리표를 함께 달아 둔다.
 * @see https://feature-sliced.design/docs/reference/public-api#cross-imports
 */

export { repoScoringOf, REPO_COUNT_FIELDS } from "@/entities/repo";
export type { RepoCountField, RepoStat, Unscored } from "@/entities/repo";
