import { SkeletonBlock } from "@/_pages/dashboard/ui/SkeletonBlock";

/** 실제 줄 수는 조회 범위에 따라 다르다. 흔한 화면에 가깝게 다섯 줄만 잡아 둔다. */
const ROWS = 5;

/** `RepoTable`이 앉을 자리. 표의 껍데기는 실물과 같은 클래스를 쓴다. */
export function RepoTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-2">
        <SkeletonBlock className="h-4 rounded" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className="px-4 py-2.5">
            <SkeletonBlock className="h-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
