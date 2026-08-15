import {
  MergedPullRequestRow,
  type PullRequest,
} from "@/entities/pull-request";
import type { Dictionary } from "@/shared/lib/i18n";

export function MergedPullRequestList({
  pullRequests,
  dict,
  emptyMessage,
}: {
  pullRequests: PullRequest[];
  dict: Dictionary;
  emptyMessage?: string;
}) {
  if (pullRequests.length === 0) {
    return (
      <p className="text-sm text-muted">
        {emptyMessage ?? dict.dashboard.merged.empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {pullRequests.map((pr) => (
        <MergedPullRequestRow key={pr.url} pr={pr} time={dict.time} />
      ))}
    </ul>
  );
}
