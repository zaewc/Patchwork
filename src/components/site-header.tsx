import Link from "next/link";
import { useId } from "react";

export function Logo({ size = 20 }: { size?: number }) {
  const cutoutId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <mask id={cutoutId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white" />
          <circle cx="12" cy="9.25" r="4.25" fill="black" />
          <path d="M10.25 11.5 7.5 23h9l-2.75-11.5Z" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${cutoutId})`}>
        <rect x="1" y="1" width="10" height="10" rx="2" fill="var(--patch-4)" />
        <rect x="13" y="1" width="10" height="10" rx="2" fill="var(--patch-2)" />
        <rect x="1" y="13" width="10" height="10" rx="2" fill="var(--patch-1)" />
        <rect x="13" y="13" width="10" height="10" rx="2" fill="var(--patch-3)" />
      </g>
    </svg>
  );
}

export function SiteHeader({
  user,
}: {
  user?: { login: string; name: string | null; avatarUrl: string };
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          Patchwork
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
              Dashboard
            </Link>
            <Link href="/export" className="text-sm text-muted hover:text-accent">
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
              <span className="hidden sm:inline">{user.name ?? user.login}</span>
            </a>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
