import { RepoLogo, REPO_COUNT_FIELDS, type RepoStat } from "@/entities/repo";
import { formatNumber } from "@/shared/lib/format";

const COLUMN_LABELS: Record<(typeof REPO_COUNT_FIELDS)[number], string> = {
  commits: "Commits",
  pullRequests: "Pull requests",
  reviews: "Reviews",
  issues: "Issues",
};

const UNKNOWN_HINT = "기여 수 상위 목록에서 잘려 정확한 수를 알 수 없습니다.";
const PARTIAL_HINT = "일부 항목을 알 수 없어 실제보다 적을 수 있습니다.";

export function RepoTable({
  repos,
  emptyMessage = "이 기간에 기여한 repository가 없습니다.",
}: {
  repos: RepoStat[];
  emptyMessage?: string;
}) {
  if (repos.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-140 text-sm">
        <thead className="border-b border-border text-left text-xs text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">Repository</th>
            {REPO_COUNT_FIELDS.map((field) => (
              <th key={field} className="px-3 py-2 text-right font-medium">
                {COLUMN_LABELS[field]}
              </th>
            ))}
            <th className="px-4 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {repos.map((repo) => {
            // 합계도 모르는 항목만큼 비어 있으므로 확정값처럼 보이지 않게 표시한다.
            const partial = REPO_COUNT_FIELDS.some((field) => repo[field] === null);

            return (
              <tr key={repo.nameWithOwner}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <RepoLogo src={repo.ownerAvatarUrl} alt="" />
                    <a
                      href={repo.url}
                      title={`권위 점수 ${repo.impact}/100`}
                      className="truncate hover:text-accent hover:underline"
                    >
                      {repo.nameWithOwner}
                    </a>
                    {repo.isPrivate ? (
                      <span className="shrink-0 text-[11px] text-muted">Private</span>
                    ) : null}
                  </div>
                </td>
                {REPO_COUNT_FIELDS.map((field) => {
                  const value = repo[field];
                  return (
                    <td
                      key={field}
                      title={value === null ? UNKNOWN_HINT : undefined}
                      className="px-3 py-2.5 text-right tabular-nums text-muted"
                    >
                      {value ?? "—"}
                    </td>
                  );
                })}
                <td
                  title={partial ? PARTIAL_HINT : undefined}
                  className="px-4 py-2.5 text-right font-medium tabular-nums"
                >
                  {formatNumber(repo.total)}
                  {partial ? <span className="text-muted">+</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
