import Link from "next/link";

export type Tab = { href: string; label: string; active: boolean };

export function TabBar({ items }: { items: Tab[] }) {
  return (
    <nav className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          aria-current={item.active ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            item.active
              ? "bg-accent-soft font-medium text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
