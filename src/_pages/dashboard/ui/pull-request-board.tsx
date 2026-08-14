import {
  PullRequestCard,
  reviewColumnOf,
  type PullRequest,
  type ReviewColumn,
} from "@/entities/pull-request";

const COLUMNS: { key: ReviewColumn; title: string; tone: string }[] = [
  { key: "changes", title: "Changes requested", tone: "text-danger" },
  { key: "review", title: "Review required", tone: "text-warn" },
  { key: "approved", title: "Approved", tone: "text-ok" },
  { key: "draft", title: "Draft", tone: "text-muted" },
];

/** 열린 PR을 검토 상태별 열로 늘어놓는다. 어디서 막혀 있는지 한눈에 보이게 하는 것이 목적이다. */
export function PullRequestBoard({
  pullRequests,
  emptyMessage = "열려 있는 pull request가 없습니다.",
}: {
  pullRequests: PullRequest[];
  emptyMessage?: string;
}) {
  if (pullRequests.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  const grouped = new Map<ReviewColumn, PullRequest[]>(COLUMNS.map((column) => [column.key, []]));
  for (const pr of pullRequests) grouped.get(reviewColumnOf(pr))!.push(pr);

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
