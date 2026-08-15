import type { PullRequest } from "@/entities/pull-request/model/types";

/** 검토 진행 상태를 한 단어로 요약한 값. 보드의 열이 이것으로 갈린다. */
export type ReviewColumn = "changes" | "review" | "approved" | "draft";

/** 초안은 아직 검토를 청한 것이 아니므로 검토 결과보다 앞선다. */
export function reviewColumnOf(pr: PullRequest): ReviewColumn {
  if (pr.isDraft) return "draft";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "changes";
  if (pr.reviewDecision === "APPROVED") return "approved";
  return "review";
}
