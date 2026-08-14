export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;

export type CheckState = "SUCCESS" | "FAILURE" | "ERROR" | "PENDING" | "EXPECTED" | null;

/** 화면이 그대로 그릴 수 있는 모양으로 옮긴 pull request */
export type PullRequest = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  mergedAt: string | null;
  reviewDecision: ReviewDecision;
  checkState: CheckState;
  repo: string;
  ownerAvatarUrl: string;
  isPrivate: boolean;
  impact: number;
  /** 최근 업데이트가 없는 채로 열려 있는 PR */
  isStale: boolean;
};
