import type { CheckState, PullRequest } from "@/lib/github";
import { relativeTime } from "@/lib/format";
import { TierBadge } from "@/components/tier-badge";

type ColumnKey = "changes" | "waiting" | "approved" | "draft";

const COLUMNS: { key: ColumnKey; title: string; note: string; tone: string }[] = [
  { key: "changes", title: "변경 요청됨", note: "내 차례입니다", tone: "text-danger" },
  { key: "waiting", title: "리뷰 대기", note: "메인테이너 응답 대기", tone: "text-warn" },
  { key: "approved", title: "승인됨", note: "머지 대기", tone: "text-ok" },
  { key: "draft", title: "초안", note: "아직 작업 중", tone: "text-muted" },
];

function columnOf(pr: PullRequest): ColumnKey {
  if (pr.isDraft) return "draft";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "changes";
  if (pr.reviewDecision === "APPROVED") return "approved";
  return "waiting";
}

const CHECK_LABEL: Record<string, { text: string; className: string }> = {
  SUCCESS: { text: "CI 통과", className: "text-ok" },
  FAILURE: { text: "CI 실패", className: "text-danger" },
  ERROR: { text: "CI 오류", className: "text-danger" },
  PENDING: { text: "CI 진행 중", className: "text-warn" },
  EXPECTED: { text: "CI 대기", className: "text-muted" },
};

function CheckBadge({ state }: { state: CheckState }) {
  if (!state) return null;
  const entry = CHECK_LABEL[state];
  if (!entry) return null;
  return <span className={entry.className}>{entry.text}</span>;
}

function PullRequestCard({ pr }: { pr: PullRequest }) {
  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <a href={pr.repoUrl} className="truncate font-medium hover:text-accent hover:underline">
          {pr.repo}
        </a>
        <TierBadge tier={pr.tier} score={pr.impact} compact />
        {pr.isExternal ? <span className="shrink-0">외부</span> : null}
        {pr.isPrivate ? <span className="shrink-0">비공개</span> : null}
      </div>

      <a
        href={pr.url}
        className="mt-1 block text-sm font-medium leading-snug hover:text-accent hover:underline"
      >
        <span className="text-muted tabular-nums">#{pr.number}</span> {pr.title}
      </a>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
        <span>{relativeTime(pr.updatedAt)} 업데이트</span>
        <CheckBadge state={pr.checkState} />
        {pr.reviews > 0 ? <span>리뷰 {pr.reviews}</span> : null}
        {pr.comments > 0 ? <span>댓글 {pr.comments}</span> : null}
        <span className="font-mono">
          <span className="text-ok">+{pr.additions}</span>{" "}
          <span className="text-danger">−{pr.deletions}</span>
        </span>
        {pr.isStale ? (
          <span className="rounded bg-warn/15 px-1.5 py-px font-medium text-warn">정체됨</span>
        ) : null}
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
          <section key={column.key} className="rounded-xl border border-border bg-surface-2 p-3">
            <header className="mb-3 flex items-baseline justify-between">
              <h3 className={`text-sm font-semibold ${column.tone}`}>
                {column.title}
                <span className="ml-1.5 tabular-nums text-muted">{items.length}</span>
              </h3>
              <span className="text-[11px] text-muted">{column.note}</span>
            </header>
            {items.length === 0 ? (
              <p className="px-1 py-4 text-xs text-muted">해당하는 PR이 없습니다.</p>
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
    return <p className="text-sm text-muted">이 기간에 머지된 PR이 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {pullRequests.map((pr) => (
        <li key={pr.url} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
          <a href={pr.url} className="min-w-0 flex-1 truncate hover:text-accent hover:underline">
            <span className="text-muted">{pr.repo}</span>{" "}
            <span className="text-muted tabular-nums">#{pr.number}</span> {pr.title}
          </a>
          <TierBadge tier={pr.tier} score={pr.impact} compact />
          <span className="shrink-0 text-[11px] text-muted">
            {pr.mergedAt ? relativeTime(pr.mergedAt) : relativeTime(pr.updatedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
