/**
 * Repository의 "권위" 추정.
 *
 * 점수는 OpenSSF Scorecard(deps.dev가 제공)를 그대로 100점 환산해 쓴다. 예전에는
 * Organization 소유·업력·최근 push 같은 신호를 우리가 손으로 가중해 매겼지만, 그
 * 가중치에는 근거가 없었다. Scorecard는 코드 리뷰 요구·의존성 고정·CI 권한·SAST 등
 * 14개 항목을 외부에서 같은 기준으로 채점하므로 훨씬 신뢰할 만하다.
 *
 * 널리 알려진 32개 프로젝트를 표본으로 본 분포 (2026-08):
 *   8.0+  express 8.5 · angular 8.3 · axios 8.1 · typescript 8.0
 *   7.x   svelte · kubernetes · lodash · supabase · rust · react · babel
 *   6.x   nuxt · pnpm · vite · prettier · prisma · eslint · tailwind · node · next.js · go · vue
 *   5.x   trpc · webpack · got · playwright · rollup
 *   4.x   date-fns · chalk · zod
 *   3.x-  slugify 3.8 · octocat/Hello-World 1.9
 *
 * 주요 OSS라 부를 프로젝트는 4.x부터 고르게 퍼져 있고, 토이·방치 저장소는 3점 아래에
 * 몰린다. 그래서 경계선은 4.0(=40점)이다. 6.0으로 잡으면 webpack·rollup·zod처럼
 * 누구나 쓰는 프로젝트가 통째로 빠진다.
 *
 * 한 가지 유의점: Scorecard는 **보안·관리 관행**을 재는 지표이고 "얼마나 널리
 * 쓰이는가"를 재지 않는다. 널리 쓰이지만 CI가 느슨한 프로젝트는 낮게 나올 수 있다.
 */

import { AUDIENCE_WEIGHTS, audienceScore } from "@/entities/repo/model/audience";

export type RepoSignals = {
  /** 비공개 Repository는 공개 OSS 권위 척도의 대상이 아니다. */
  isPrivate: boolean;
  /** deps.dev가 그 repository를 모를 때 쓰는 대비책 */
  stars: number;
  forks: number;
};

/** 주요 OSS로 인정하는 점수. Scorecard 4.0에 해당한다. */
export const NOTABLE_MIN = 40;

export { AUDIENCE_WEIGHTS };

/**
 * @param scorecard deps.dev가 준 OpenSSF Scorecard 총점(0~10). 모르면 null.
 */
export function scoreRepo(signals: RepoSignals, scorecard: number | null): number {
  // 사내 Repository는 공개 생태계에서의 권위와 무관하고, deps.dev에도 없다.
  if (signals.isPrivate) return 0;

  // Scorecard가 있으면 그것이 답이다.
  if (scorecard !== null) return Math.round(scorecard * 10);

  // 없으면 외부 관심의 크기만으로 짐작한다. 검증되지 않은 만큼 상한이 낮다.
  return Math.round(audienceScore(signals.stars, signals.forks));
}

/** 주요 OSS(= 목록에 올릴 만한 프로젝트)인지 */
export function isNotable(score: number): boolean {
  return score >= NOTABLE_MIN;
}
