import { SkeletonBlock } from "@/_pages/dashboard/ui/SkeletonBlock";

/** 실제 줄 수는 조회 범위에 따라 다르다. 흔한 화면에 가깝게 다섯 줄만 잡아 둔다. */
const ROWS = 5;

/** `MergedPullRequestList`가 앉을 자리 */
export function MergedPullRequestListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} className="px-4 py-2.5">
          <SkeletonBlock className="h-5 rounded" />
        </div>
      ))}
    </div>
  );
}
