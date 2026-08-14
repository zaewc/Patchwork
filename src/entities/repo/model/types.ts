/** 한 Repository에 대한 기여 집계. 항목이 null이면 GitHub 상한에 걸려 알 수 없다는 뜻이다. */
export type RepoStat = {
  nameWithOwner: string;
  url: string;
  /** owner(사용자·조직)의 avatar. 사실상 프로젝트 로고 역할을 한다. */
  ownerAvatarUrl: string;
  isPrivate: boolean;
  isExternal: boolean;
  /** 0~100 권위 추정 점수 (model/impact.ts) */
  impact: number;
  commits: number | null;
  pullRequests: number | null;
  reviews: number | null;
  issues: number | null;
  total: number;
};

/** RepoStat에서 기여 수를 담는 항목들. 표의 열과 "잘렸는지" 판정이 같은 목록을 본다. */
export const REPO_COUNT_FIELDS = ["commits", "pullRequests", "reviews", "issues"] as const;

export type RepoCountField = (typeof REPO_COUNT_FIELDS)[number];
