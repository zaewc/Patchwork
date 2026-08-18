import { SkeletonBlock } from "@/_pages/dashboard/ui/SkeletonBlock";

/** 검토 상태별 열 넷과 열마다 놓을 카드 수 */
const COLUMNS = 4;
const CARDS = 2;

/** `PullRequestBoard`가 앉을 자리 */
export function PullRequestBoardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: COLUMNS }, (_, column) => (
        <div key={column}>
          <SkeletonBlock className="mb-2 h-5 w-32 rounded" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: CARDS }, (_, card) => (
              <div
                key={card}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <SkeletonBlock className="h-3.5 w-24 rounded" />
                <SkeletonBlock className="mt-1 h-5 rounded" />
                <SkeletonBlock className="mt-2 h-3.5 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
