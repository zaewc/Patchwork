import Link from "next/link";
import { Logo } from "@/widgets/site-header/ui/Logo";
import type { GitHubViewer } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { SignOutIcon } from "@/shared/ui/icon";

/** 모든 화면의 머리. 로그인 상태에서만 사용자 메뉴가 붙는다. */
export function SiteHeader({ user }: { user?: GitHubViewer }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={ROUTES.home}
          prefetch={false}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Logo />
          Patchwork
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.dashboard}
              prefetch={false}
              className="text-sm text-muted hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.export}
              prefetch={false}
              className="text-sm text-muted hover:text-accent"
            >
              README
            </Link>
            <a
              href={`https://github.com/${user.login}`}
              className="flex items-center gap-2 text-sm hover:text-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl}
                alt=""
                width={28}
                height={28}
                className="rounded-full border border-border"
              />
              <span className="hidden sm:inline">
                {user.name ?? user.login}
              </span>
            </a>
            <form action={ROUTES.logout} method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <SignOutIcon />
                로그아웃
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
