import { RepoLogo } from "@/entities/repo/@x/pull-request";
import { checkLabelOf } from "@/entities/pull-request/lib/checks";
import type { PullRequest } from "@/entities/pull-request/model/types";
import { relativeTime } from "@/shared/lib/format";

/** 보드에 놓이는 열린 PR 한 장 */
export function PullRequestCard({ pr }: { pr: PullRequest }) {
  const checks = checkLabelOf(pr.checkState);

  return (
    <li className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <RepoLogo src={pr.ownerAvatarUrl} alt="" size={14} />
        <span className="truncate">{pr.repo}</span>
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
        {checks ? <span className={checks.tone}>{checks.text}</span> : null}
        {pr.isStale ? <span className="text-warn">Stale</span> : null}
      </div>
    </li>
  );
}
