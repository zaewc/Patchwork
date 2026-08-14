import Link from "next/link";
import type { RangeKey } from "@/lib/github";

/** 대시보드 전체를 주요 OSS만 볼지, 일반 프로젝트까지 볼지 전환한다. */
export function ScopeTabs({ range, showAll }: { range: RangeKey; showAll: boolean }) {
  return (
    <nav className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm">
      {[false, true].map((all) => {
        const active = all === showAll;
        return (
          <Link
            key={String(all)}
            href={`/dashboard?range=${range}${all ? "&scope=all" : ""}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-fg"
            }`}
          >
            {all ? "전체" : "주요 OSS"}
          </Link>
        );
      })}
    </nav>
  );
}
