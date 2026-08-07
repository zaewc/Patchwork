/**
 * 저장소의 "권위" 추정.
 *
 * 스타 수만으로는 1인 토이 프로젝트(스타 많음)와 재단이 운영하는 인프라 프로젝트(스타 적음)를
 * 구분할 수 없다. 그래서 규모(스타) 외에 기여자 폭, 조직 소유 여부, 성숙도, 활성도를 함께 본다.
 * 어디까지나 휴리스틱이며, 가중치는 아래 WEIGHTS에서 조정할 수 있다.
 */

export type ImpactTier = "flagship" | "major" | "community" | "personal";

export type RepoSignals = {
  /** 비공개 저장소는 공개 OSS 권위 척도의 대상이 아니다. */
  isPrivate: boolean;
  stars: number;
  /**
   * 참여 폭의 대용치. GitHub GraphQL에는 contributor count가 없다.
   * mentionableUsers.totalCount 가 더 정확하지만 저장소마다 사용자를 세느라
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
  /** 스타 40점 만점. 로그 스케일 — 10★=8, 1k★=24, 100k★=40 */
  stars: 40,
  /** 참여 폭 20점 만점. 포크 2만 개에서 만점 */
  forks: 20,
  /** 조직(개인 계정이 아닌) 소유 */
  organization: 12,
  /** 성숙도: 라이선스 8 + 업력 8 */
  license: 8,
  age: 8,
  /** 활성도: 90일 내 푸시 12, 1년 내 푸시 6 */
  activity: 12,
  /** 감점. 포크는 상류의 명성을 물려받기 쉬워 크게 깎는다. */
  forkPenalty: 25,
  archivedPenalty: 20,
} as const;

export const TIERS: { tier: ImpactTier; min: number; label: string; description: string }[] = [
  { tier: "flagship", min: 75, label: "대표 OSS", description: "생태계의 중심이 되는 프로젝트" },
  { tier: "major", min: 55, label: "주요 OSS", description: "조직이 운영하는 널리 쓰이는 프로젝트" },
  { tier: "community", min: 38, label: "커뮤니티", description: "여러 사람이 함께 유지보수하는 프로젝트" },
  { tier: "personal", min: 0, label: "개인·소규모", description: "소수가 관리하는 프로젝트" },
];

const YEAR = 365 * 86_400_000;

function logScore(value: number, full: number, max: number): number {
  if (value <= 0) return 0;
  const ratio = Math.log10(value + 1) / Math.log10(full + 1);
  return Math.min(max, max * ratio);
}

export function scoreRepo(signals: RepoSignals, now: number = Date.now()): number {
  // 사내 저장소는 참여자가 많아도 공개 생태계에서의 권위와는 무관하다.
  if (signals.isPrivate) return 0;

  let score = 0;

  score += logScore(signals.stars, 100_000, WEIGHTS.stars);
  score += logScore(signals.forks, 20_000, WEIGHTS.forks);
  if (signals.isInOrganization) score += WEIGHTS.organization;

  if (signals.hasLicense) score += WEIGHTS.license;
  if (now - new Date(signals.createdAt).getTime() >= 2 * YEAR) score += WEIGHTS.age;

  if (signals.pushedAt) {
    const idle = now - new Date(signals.pushedAt).getTime();
    if (idle <= 0.25 * YEAR) score += WEIGHTS.activity;
    else if (idle <= YEAR) score += WEIGHTS.activity / 2;
  }

  // 포크는 상류 프로젝트의 지표를 그대로 물려받으므로 깎고, 보관된 저장소도 낮춘다.
  if (signals.isFork) score -= WEIGHTS.forkPenalty;
  if (signals.isArchived) score -= WEIGHTS.archivedPenalty;

  return Math.max(0, Math.round(score));
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
