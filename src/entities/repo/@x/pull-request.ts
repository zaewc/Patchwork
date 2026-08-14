/**
 * entities/pull-request 만을 위한 공개 API ("repo crossed with pull-request").
 *
 * PR은 언제나 어떤 repository에 달린다. 그래서 PR을 옮길 때 그 repository의 점수 꼬리표를
 * 함께 달고, PR을 그릴 때 repository 로고를 함께 보여준다.
 * @see https://feature-sliced.design/docs/reference/public-api#cross-imports
 */

export { RepoLogo, repoScoringOf } from "@/entities/repo";
export type { Unscored } from "@/entities/repo";
