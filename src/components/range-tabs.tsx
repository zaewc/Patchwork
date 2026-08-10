import Link from "next/link";
import { RANGES, type RangeKey } from "@/lib/github";

export function RangeTabs({ current }: { current: RangeKey }) {
  return (
    <nav className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
      {(Object.keys(RANGES) as RangeKey[]).map((key) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={`/dashboard?range=${key}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg"
            }`}
          >
            {RANGES[key].label}
          </Link>
        );
      })}
    </nav>
  );
}
