import { ChevronDownIcon, SignOutIcon } from "@/shared/ui/icon";
import type { GitHubViewer } from "@/shared/api";
import { ROUTES } from "@/shared/config";

/** 프로필로 가는 일과 세션을 끝내는 일을 한 자리에 모은 사용자 메뉴. */
export function UserMenu({
  user,
  signOutLabel,
}: {
  user: GitHubViewer;
  signOutLabel: string;
}) {
  const displayName = user.name ?? user.login;

  return (
    <details className="group relative">
      <summary
        aria-label={displayName}
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-1.5 text-sm font-medium transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatarUrl}
          alt=""
          width={28}
          height={28}
          className="rounded-full border border-border bg-surface-2"
        />
        <span className="hidden max-w-32 truncate lg:block">{displayName}</span>
        <ChevronDownIcon
          size={12}
          className="text-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 text-sm shadow-xl">
        <a
          href={`https://github.com/${user.login}`}
          className="flex min-w-0 flex-col rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="truncate font-medium text-fg">{displayName}</span>
          <span aria-hidden className="truncate text-xs text-muted">
            @{user.login}
          </span>
        </a>

        <div className="my-1 h-px bg-border" />

        <form action={ROUTES.logout} method="post">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <SignOutIcon />
            {signOutLabel}
          </button>
        </form>
      </div>
    </details>
  );
}
