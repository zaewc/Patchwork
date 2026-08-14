/**
 * 외부 관심의 크기. deps.dev가 그 repository를 모를 때만 쓰는 대비책이다.
 *
 * Stars·Forks는 "바깥에서 이 프로젝트를 쓰거나 참여한 흔적"이지 관리 품질의 증거가
 * 아니다. 그래서 60점을 상한으로 둔다 — Scorecard를 받은 프로젝트의 상위권(62~85)은
 * 넘지 못하므로, 검증된 프로젝트가 검증되지 않은 프로젝트보다 늘 앞선다.
 */

export const AUDIENCE_WEIGHTS = {
  stars: 45,
  /**
   * 참여 폭의 대용치. GitHub GraphQL에는 contributor count가 없다.
   * mentionableUsers.totalCount 가 더 정확하지만 Repository마다 사용자를 세느라
   * 집계 쿼리를 통째로 타임아웃(502)시켜서, 스칼라 필드인 forkCount를 쓴다.
   */
  forks: 15,
} as const;

/** 로그 스케일. star 10개와 100개의 차이가 10,000개와 100,000개의 차이와 같다. */
function logScore(value: number, full: number, max: number): number {
  if (value <= 0) return 0;
  return Math.min(max, max * (Math.log10(value + 1) / Math.log10(full + 1)));
}

export function audienceScore(stars: number, forks: number): number {
  return (
    logScore(stars, 100_000, AUDIENCE_WEIGHTS.stars) +
    logScore(forks, 20_000, AUDIENCE_WEIGHTS.forks)
  );
}
