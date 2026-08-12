import type { RepoStat } from "@/lib/github";
import { formatNumber } from "@/lib/format";
import { TierBadge } from "@/components/tier-badge";

export function RepoTable({ repos }: { repos: RepoStat[] }) {
  if (repos.length === 0) {
    return <p className="text-sm text-muted">이 기간에 기여한 저장소가 없습니다.</p>;
  }

  const max = Math.max(...repos.map((r) => r.total), 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-border text-left text-xs text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">저장소</th>
            <th className="px-3 py-2 text-right font-medium">커밋</th>
            <th className="px-3 py-2 text-right font-medium">PR</th>
            <th className="px-3 py-2 text-right font-medium">리뷰</th>
            <th className="px-3 py-2 text-right font-medium">이슈</th>
            <th className="px-4 py-2 text-right font-medium">합계</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {repos.map((repo) => (
            <tr key={repo.nameWithOwner} className="relative">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <a
                    href={repo.url}
                    className="truncate font-medium hover:text-accent hover:underline"
                  >
                    {repo.nameWithOwner}
                  </a>
                  <TierBadge tier={repo.tier} score={repo.impact} />
                  {repo.isExternal ? (
                    <span className="shrink-0 text-[11px] text-muted">외부</span>
                  ) : null}
                  {repo.isPrivate ? (
                    <span className="shrink-0 text-[11px] text-muted">비공개</span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                  {repo.language ? (
                    <span className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: repo.language.color ?? "var(--muted)" }}
                      />
                      {repo.language.name}
                    </span>
                  ) : null}
                  {repo.stars > 0 ? <span>★ {formatNumber(repo.stars)}</span> : null}
                  {repo.forks > 0 ? <span>포크 {formatNumber(repo.forks)}</span> : null}
                </div>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{repo.commits || "—"}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                {repo.pullRequests || "—"}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{repo.reviews || "—"}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{repo.issues || "—"}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <span
                    className="hidden h-1.5 rounded-full bg-accent/70 sm:block"
                    style={{ width: `${Math.max(6, (repo.total / max) * 72)}px` }}
                  />
                  <span className="w-10 font-semibold tabular-nums">{formatNumber(repo.total)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
