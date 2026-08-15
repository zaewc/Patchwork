import { RepoLogo, REPO_COUNT_FIELDS, type RepoStat } from "@/entities/repo";
import { formatNumber } from "@/shared/lib/format";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";

const COLUMN_LABELS: Record<(typeof REPO_COUNT_FIELDS)[number], string> = {
  commits: "Commits",
  pullRequests: "Pull requests",
  reviews: "Reviews",
  issues: "Issues",
};

export function RepoTable({
  repos,
  dict,
  emptyMessage,
}: {
  repos: RepoStat[];
  dict: Dictionary;
  emptyMessage?: string;
}) {
  const { empty, unknownHint, partialHint, impactTitle } =
    dict.dashboard.repoTable;

  if (repos.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage ?? empty}</p>;
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
            const partial = REPO_COUNT_FIELDS.some(
              (field) => repo[field] === null,
            );

            return (
              <tr key={repo.nameWithOwner}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <RepoLogo src={repo.ownerAvatarUrl} alt="" />
                    <a
                      href={repo.url}
                      title={interpolate(impactTitle, { score: repo.impact })}
                      className="truncate hover:text-accent hover:underline"
                    >
                      {repo.nameWithOwner}
                    </a>
                    {repo.isPrivate ? (
                      <span className="shrink-0 text-[11px] text-muted">
                        Private
                      </span>
                    ) : null}
                  </div>
                </td>
                {REPO_COUNT_FIELDS.map((field) => {
                  const value = repo[field];
                  return (
                    <td
                      key={field}
                      title={value === null ? unknownHint : undefined}
                      className="px-3 py-2.5 text-right tabular-nums text-muted"
                    >
                      {value ?? "—"}
                    </td>
                  );
                })}
                <td
                  title={partial ? partialHint : undefined}
                  className="px-4 py-2.5 text-right font-medium tabular-nums"
                >
                  {formatNumber(repo.total, dict.numberLocale)}
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
