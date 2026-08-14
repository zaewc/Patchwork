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
 * 어디까지나 휴리스틱이며, 가중치와 등급 경계는 아래 WEIGHTS·TIERS에서 조정한다.
 */

export type ImpactTier = "flagship" | "major" | "community" | "personal";

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
  /** License가 없으면 정의상 오픈소스가 아니므로 이 점수를 넘지 못한다. */
  unlicensedCap: 30,
} as const;

export const TIERS: { tier: ImpactTier; min: number; label: string; description: string }[] = [
  { tier: "flagship", min: 80, label: "대표 OSS", description: "생태계의 중심이 되는 프로젝트" },
  { tier: "major", min: 60, label: "주요 OSS", description: "널리 쓰이는 프로젝트" },
  { tier: "community", min: 40, label: "커뮤니티", description: "바깥에서 쓰고 참여하는 프로젝트" },
  { tier: "personal", min: 0, label: "개인·소규모", description: "사실상 내부용 프로젝트" },
];

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

  // 잘 관리되고 있다는 신호. org 소유·업력·활성도만으로는 사내 프로젝트도 만점을 받으므로,
  // audience를 초과해서 받아갈 수 없게 묶는다. audience가 0이면 이 점수도 0이다.
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

  // License 없는 Repository는 법적으로 오픈소스가 아니다. 등급을 받지 못하게 상한을 둔다.
  return signals.hasLicense ? score : Math.min(score, WEIGHTS.unlicensedCap);
}

export function tierOf(score: number): ImpactTier {
  return TIERS.find((t) => score >= t.min)!.tier;
}

export function tierMeta(tier: ImpactTier) {
  return TIERS.find((t) => t.tier === tier)!;
}

/** 주요 OSS 이상(= 권위 있는 프로젝트)인지 */
export function isNotableTier(tier: ImpactTier): boolean {
  return tier === "flagship" || tier === "major";
}

export const TIER_BADGE_CLASS: Record<ImpactTier, string> = {
  flagship: "bg-accent text-white",
  major: "bg-accent-soft text-accent",
  community: "border border-border text-muted",
  personal: "text-muted",
};
