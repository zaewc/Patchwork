import Link from "next/link";
import { LocaleSwitch } from "@/widgets/site-header/ui/LocaleSwitch";
import { Logo } from "@/widgets/site-header/ui/Logo";
import type { GitHubViewer } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { Dictionary } from "@/shared/lib/i18n";
import { SignOutIcon } from "@/shared/ui/icon";

/** 모든 화면의 머리. 로그인 상태에서만 사용자 메뉴가 붙고, 언어 전환은 늘 있다. */
export function SiteHeader({
  user,
  dict,
}: {
  user?: GitHubViewer;
  dict: Dictionary;
}) {
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

        <div className="flex items-center gap-3">
          {user ? (
            <>
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
                  {dict.header.signOut}
                </button>
              </form>
            </>
          ) : null}

          <LocaleSwitch locale={dict.locale} label={dict.header.language} />
        </div>
      </div>
    </header>
  );
}
