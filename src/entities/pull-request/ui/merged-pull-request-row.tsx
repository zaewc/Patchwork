import { RepoLogo } from "@/entities/repo/@x/pull-request";
import type { PullRequest } from "@/entities/pull-request/model/types";
import { relativeTime } from "@/shared/lib/format";

/** 목록에 놓이는 merge된 PR 한 줄 */
export function MergedPullRequestRow({ pr }: { pr: PullRequest }) {
  return (
    <li className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
      <RepoLogo src={pr.ownerAvatarUrl} alt="" />
      <a href={pr.url} className="min-w-0 flex-1 truncate hover:text-accent hover:underline">
        <span className="text-muted">{pr.repo}</span>{" "}
        <span className="text-muted tabular-nums">#{pr.number}</span> {pr.title}
      </a>
      <span className="shrink-0 text-[11px] text-muted">
        {relativeTime(pr.mergedAt ?? pr.updatedAt)}
      </span>
    </li>
  );
}
