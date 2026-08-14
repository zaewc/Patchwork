import { MergedPullRequestRow, type PullRequest } from "@/entities/pull-request";

export function MergedPullRequestList({
  pullRequests,
  emptyMessage = "이 기간에 merge된 pull request가 없습니다.",
}: {
  pullRequests: PullRequest[];
  emptyMessage?: string;
}) {
  if (pullRequests.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {pullRequests.map((pr) => (
        <MergedPullRequestRow key={pr.url} pr={pr} />
      ))}
    </ul>
  );
}
