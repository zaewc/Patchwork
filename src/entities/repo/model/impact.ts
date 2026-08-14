/**
 * Repository의 "권위" 추정.
 *
 * 점수는 OpenSSF Scorecard(deps.dev가 제공)를 그대로 100점 환산해 쓴다. 예전에는
 * Organization 소유·업력·최근 push 같은 신호를 우리가 손으로 가중해 매겼지만, 그
 * 가중치에는 근거가 없었다. Scorecard는 코드 리뷰 요구·의존성 고정·CI 권한·SAST 등
 * 14개 항목을 외부에서 같은 기준으로 채점하므로 훨씬 신뢰할 만하다.
 *
 * 관측된 분포 (2026-08):
 *   expressjs/express 8.5 · axios 8.1 · typescript 8.0 · kubernetes 7.6 · react 7.0
 *   next.js 6.2 · go 6.2 · chalk 4.6 · slugify 3.8 · octocat/Hello-World 1.9
 *
 * 그래서 NOTABLE_MIN 60은 "잘 관리되는 주요 프로젝트"에 대체로 들어맞는다.
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

/** 주요 OSS로 인정하는 점수. Scorecard 6.0에 해당한다. */
export const NOTABLE_MIN = 60;

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
