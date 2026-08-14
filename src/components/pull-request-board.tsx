import type { CheckState, PullRequest } from "@/lib/github";
import { relativeTime } from "@/lib/format";
import { TierBadge } from "@/components/tier-badge";

type ColumnKey = "changes" | "review" | "approved" | "draft";

const COLUMNS: { key: ColumnKey; title: string; tone: string }[] = [
  { key: "changes", title: "Changes requested", tone: "text-danger" },
  { key: "review", title: "Review required", tone: "text-warn" },
  { key: "approved", title: "Approved", tone: "text-ok" },
  { key: "draft", title: "Draft", tone: "text-muted" },
];

function columnOf(pr: PullRequest): ColumnKey {
  if (pr.isDraft) return "draft";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "changes";
  if (pr.reviewDecision === "APPROVED") return "approved";
  return "review";
}

const CHECKS: Partial<Record<NonNullable<CheckState>, { text: string; className: string }>> = {
  SUCCESS: { text: "Checks passed", className: "text-ok" },
  FAILURE: { text: "Checks failed", className: "text-danger" },
  ERROR: { text: "Checks failed", className: "text-danger" },
  PENDING: { text: "Checks pending", className: "text-warn" },
};

function PullRequestCard({ pr }: { pr: PullRequest }) {
  const checks = pr.checkState ? CHECKS[pr.checkState] : undefined;

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <span className="truncate">{pr.repo}</span>
        <TierBadge tier={pr.tier} score={pr.impact} />
        {pr.isPrivate ? <span className="shrink-0">Private</span> : null}
      </div>

      <a
        href={pr.url}
        className="mt-1 block text-sm leading-snug hover:text-accent hover:underline"
      >
        <span className="text-muted tabular-nums">#{pr.number}</span> {pr.title}
      </a>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
        <span>{relativeTime(pr.updatedAt)}</span>
        {checks ? <span className={checks.className}>{checks.text}</span> : null}
        {pr.isStale ? <span className="text-warn">Stale</span> : null}
      </div>
    </li>
  );
}

export function PullRequestBoard({ pullRequests }: { pullRequests: PullRequest[] }) {
  const grouped = new Map<ColumnKey, PullRequest[]>(COLUMNS.map((c) => [c.key, []]));
  for (const pr of pullRequests) grouped.get(columnOf(pr))!.push(pr);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((column) => {
        const items = grouped.get(column.key)!;
        return (
          <section key={column.key}>
            <h3 className={`mb-2 text-sm font-medium ${column.tone}`}>
              {column.title}
              <span className="ml-1.5 tabular-nums text-muted">{items.length}</span>
            </h3>
            {items.length === 0 ? (
              <p className="text-xs text-muted">없음</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((pr) => (
                  <PullRequestCard key={pr.url} pr={pr} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MergedPullRequests({ pullRequests }: { pullRequests: PullRequest[] }) {
  if (pullRequests.length === 0) {
    return <p className="text-sm text-muted">이 기간에 merge된 pull request가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {pullRequests.map((pr) => (
        <li key={pr.url} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <a href={pr.url} className="min-w-0 flex-1 truncate hover:text-accent hover:underline">
            <span className="text-muted">{pr.repo}</span>{" "}
            <span className="text-muted tabular-nums">#{pr.number}</span> {pr.title}
          </a>
          <TierBadge tier={pr.tier} score={pr.impact} />
          <span className="shrink-0 text-[11px] text-muted">
            {relativeTime(pr.mergedAt ?? pr.updatedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
