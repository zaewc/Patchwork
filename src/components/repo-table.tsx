import type { RepoStat } from "@/lib/github";
import { formatNumber } from "@/lib/format";
import { RepoLogo } from "@/components/repo-logo";

const UNKNOWN_HINT = "기여 수 상위 100곳까지만 집계되어 정확한 수를 알 수 없습니다.";

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
            <th className="px-3 py-2 text-right font-medium">Commits</th>
            <th className="px-3 py-2 text-right font-medium">Pull requests</th>
            <th className="px-3 py-2 text-right font-medium">Reviews</th>
            <th className="px-3 py-2 text-right font-medium">Issues</th>
            <th className="px-4 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {repos.map((repo) => (
            <tr key={repo.nameWithOwner}>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <RepoLogo src={repo.ownerAvatarUrl} alt="" />
                  <a href={repo.url} className="truncate hover:text-accent hover:underline">
                    {repo.nameWithOwner}
                  </a>
                  {repo.isPrivate ? (
                    <span className="shrink-0 text-[11px] text-muted">Private</span>
                  ) : null}
                </div>
              </td>
              {([repo.commits, repo.pullRequests, repo.reviews, repo.issues] as const).map(
                (value, index) => (
                  <td
                    key={index}
                    title={value === null ? UNKNOWN_HINT : undefined}
                    className="px-3 py-2.5 text-right tabular-nums text-muted"
                  >
                    {value ?? "—"}
                  </td>
                ),
              )}
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                {formatNumber(repo.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
