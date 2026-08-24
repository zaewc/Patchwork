import Link from "next/link";
import { LocaleSwitch } from "@/widgets/site-header/ui/LocaleSwitch";
import { Logo } from "@/widgets/site-header/ui/Logo";
import { ThemeSwitch } from "@/widgets/site-header/ui/ThemeSwitch";
import { UserMenu } from "@/widgets/site-header/ui/UserMenu";
import type { GitHubViewer } from "@/shared/api";
import { DEFAULT_THEME, ROUTES, type Theme } from "@/shared/config";
import type { Dictionary } from "@/shared/lib/i18n";

/**
 * 모든 화면의 머리. 로그인 상태에서만 사용자 메뉴가 붙고, 언어·테마 전환은 늘 있다.
 *
 * 보는 방식을 정하는 것 둘(언어·테마)은 로그인 전에도 쓸 수 있어야 한다. 로그인 화면에서
 * 눈이 부시다고 로그인부터 해야 할 이유는 없다.
 */
export function SiteHeader({
  user,
  theme = DEFAULT_THEME,
  dict,
  active,
}: {
  user?: GitHubViewer;
  theme?: Theme;
  dict: Dictionary;
  active?: "dashboard" | "export";
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-4 px-4 py-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <Link
          href={ROUTES.home}
          prefetch={false}
          className="flex shrink-0 items-center gap-2.5 rounded-lg pr-2 font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:justify-self-start"
        >
          <Logo />
          Patchwork
        </Link>

        {user ? (
          <nav className="order-last mt-2 flex basis-full border-b border-border sm:col-start-2 sm:row-start-1 sm:mt-0 sm:basis-auto sm:justify-self-center">
            <Link
              href={ROUTES.dashboard}
              prefetch={false}
              aria-current={active === "dashboard" ? "page" : undefined}
              className={`relative flex-1 rounded-t-lg px-4 py-2.5 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                active === "dashboard"
                  ? "font-semibold text-accent after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-full after:bg-accent"
                  : "font-medium text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.export}
              prefetch={false}
              aria-current={active === "export" ? "page" : undefined}
              className={`relative flex-1 rounded-t-lg px-4 py-2.5 text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                active === "export"
                  ? "font-semibold text-accent after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-full after:bg-accent"
                  : "font-medium text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              README
            </Link>
          </nav>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:col-start-3 sm:row-start-1 sm:ml-0 sm:justify-self-end">
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-1">
            <ThemeSwitch theme={theme} dict={dict} />
            <LocaleSwitch locale={dict.locale} label={dict.header.language} />
          </div>

          {user ? (
            <>
              <span aria-hidden className="h-6 w-px bg-border" />
              <UserMenu user={user} signOutLabel={dict.header.signOut} />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
