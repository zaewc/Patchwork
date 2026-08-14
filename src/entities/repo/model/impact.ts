/**
 * Repository의 "권위" 추정.
 *
 *   score = audience + min(trust, audience)
 *
 * audience(Stars·Forks)는 바깥에서 이 프로젝트를 쓰거나 참여한 흔적이고,
 * trust(Organization 소유·업력·활성도)는 잘 관리되고 있다는 신호다.
 * 둘을 그냥 더하면 아무도 안 쓰는 사내 프로젝트가 "org 소유 + 최근 push"만으로
 * 등급을 받으므로, trust는 audience를 넘겨 받을 수 없게 묶는다. 즉 외부 관심이
 * 0이면 아무리 잘 관리해도 0점이다.
 *
 * 어디까지나 휴리스틱이며, 가중치와 기준선은 아래 WEIGHTS·NOTABLE_MIN에서 조정한다.
 */

export type RepoSignals = {
  /** 비공개 Repository는 공개 OSS 권위 척도의 대상이 아니다. */
  isPrivate: boolean;
  stars: number;
  /**
   * 참여 폭의 대용치. GitHub GraphQL에는 contributor count가 없다.
   * mentionableUsers.totalCount 가 더 정확하지만 Repository마다 사용자를 세느라
   * 집계 쿼리를 통째로 타임아웃(502)시켜서, 스칼라 필드인 forkCount를 쓴다.
   */
  forks: number;
  isInOrganization: boolean;
  isFork: boolean;
  isArchived: boolean;
  hasLicense: boolean;
  createdAt: string;
  pushedAt: string | null;
};

export const WEIGHTS = {
  /** 외부 관심(audience) 60점 만점 — Stars 45 + Forks 15 */
  stars: 45,
  forks: 15,
  /** 신뢰 신호 40점 만점. 단, audience를 넘겨 받을 수 없다 (scoreRepo 참고) */
  organization: 14,
  age: 10,
  /** 90일 내 push 16, 1년 내 push 8 */
  activity: 16,
  /** 감점. fork는 상류의 명성을 물려받기 쉬워 크게 깎는다. */
  forkPenalty: 25,
  archivedPenalty: 20,
} as const;

/** 등급을 받기 위한 최소 Stars. 점수와 무관하게 이 아래는 주요 OSS로 보지 않는다. */
export const MIN_STARS = 30;

/** 주요 OSS로 인정하는 점수. 실질적으로 Stars 600개 안팎이 기준선이다. */
export const NOTABLE_MIN = 60;

/** 자격 미달 Repository의 점수 상한 — NOTABLE_MIN에 닿지 못한다. */
const UNRANKED_CAP = NOTABLE_MIN - 1;

const YEAR = 365 * 86_400_000;

function logScore(value: number, full: number, max: number): number {
  if (value <= 0) return 0;
  const ratio = Math.log10(value + 1) / Math.log10(full + 1);
  return Math.min(max, max * ratio);
}

export function scoreRepo(signals: RepoSignals, now: number = Date.now()): number {
  // 사내 Repository는 참여자가 많아도 공개 생태계에서의 권위와는 무관하다.
  if (signals.isPrivate) return 0;

  // 바깥에서 실제로 쓰거나 참여한 흔적. 이것이 없으면 오픈소스라 부를 근거가 없다.
  const audience =
    logScore(signals.stars, 100_000, WEIGHTS.stars) +
    logScore(signals.forks, 20_000, WEIGHTS.forks);

  let trust = 0;
  if (signals.isInOrganization) trust += WEIGHTS.organization;
  if (now - new Date(signals.createdAt).getTime() >= 2 * YEAR) trust += WEIGHTS.age;
  if (signals.pushedAt) {
    const idle = now - new Date(signals.pushedAt).getTime();
    if (idle <= 0.25 * YEAR) trust += WEIGHTS.activity;
    else if (idle <= YEAR) trust += WEIGHTS.activity / 2;
  }

  let score = audience + Math.min(trust, audience);

  // fork는 상류 프로젝트의 지표를 그대로 물려받으므로 깎고, archive된 Repository도 낮춘다.
  if (signals.isFork) score -= WEIGHTS.forkPenalty;
  if (signals.isArchived) score -= WEIGHTS.archivedPenalty;

  score = Math.max(0, Math.round(score));

  // 자격 조건: Stars 최소선을 못 넘거나 License가 없으면 등급을 주지 않는다.
  // (License 없는 Repository는 정의상 오픈소스가 아니다)
  const qualified = signals.stars >= MIN_STARS && signals.hasLicense;
  return qualified ? score : Math.min(score, UNRANKED_CAP);
}

/** 주요 OSS(= 목록에 올릴 만한 프로젝트)인지 */
export function isNotable(score: number): boolean {
  return score >= NOTABLE_MIN;
}
