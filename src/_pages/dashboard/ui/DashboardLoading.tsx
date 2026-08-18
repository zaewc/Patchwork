import { MergedPullRequestListSkeleton } from "@/_pages/dashboard/ui/MergedPullRequestListSkeleton";
import { PullRequestBoardSkeleton } from "@/_pages/dashboard/ui/PullRequestBoardSkeleton";
import { RepoTableSkeleton } from "@/_pages/dashboard/ui/RepoTableSkeleton";
import { Section } from "@/_pages/dashboard/ui/Section";
import { SkeletonBlock } from "@/_pages/dashboard/ui/SkeletonBlock";

/** 퀼트 격자의 요일 행 수. 실제 퀼트와 같은 세로 치수를 잡으려고 맞춘다. */
const QUILT_ROWS = 7;
const STAT_CARDS = 4;

/**
 * 아무것도 받지 못한 동안 실제 화면과 같은 자리에 자리만 잡아 둔다.
 *
 * 라우트의 `loading.tsx`가 쓰는 자리다. 요청을 읽지 않으므로 사용자도 조회 조건도 모르고,
 * 그래서 여기만은 통째로 회색이다. 화면 안에서 일부만 기다릴 때는 `DashboardContent`가
 * 이 껍데기를 구역 단위로 나눠 쓴다.
 *
 * 두 가지를 지킨다. 하나, **이미 아는 것은 가리지 않는다** — 머리는 `DashboardLayout`이
 * 세션만으로 그려 두었고, 구역 제목처럼 언어와 무관한 골격 라벨은 그대로 적는다.
 * 둘, **자리는 실제 껍데기로 잡는다** — 높이를 손으로 계산해 두면 화면이 바뀔 때 조용히
 * 어긋나고, 도착하는 순간 화면이 튄다.
 */
export function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SkeletonBlock className="h-7 w-40 rounded-md" />
        {/* 범위 탭 둘과 새로고침 버튼. 어느 조건을 보고 있는지 모르는 자리라 자리만 잡는다. */}
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-9.5 w-32 rounded-lg" />
          <SkeletonBlock className="h-9.5 w-52 rounded-lg" />
          <SkeletonBlock className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: STAT_CARDS }, (_, card) => (
          <div
            key={card}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <SkeletonBlock className="h-4 w-24 rounded" />
            <SkeletonBlock className="mt-1 h-8 w-20 rounded" />
            <SkeletonBlock className="mt-1 h-4 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* 조회 범위는 아직 모르므로 제목에 기간을 덧붙이지 않는다. */}
      <Section title="Contributions">
        <div className="rounded-xl border border-border bg-surface p-4">
          <SkeletonBlock className="h-4 w-48 rounded" />
          <div className="flex flex-col gap-[3px]">
            {Array.from({ length: QUILT_ROWS }, (_, row) => (
              <SkeletonBlock key={row} className="h-3 rounded-sm" />
            ))}
          </div>
          <SkeletonBlock className="mt-3 h-4 w-40 rounded" />
        </div>
      </Section>

      <Section title="Repositories">
        <RepoTableSkeleton />
      </Section>

      <Section title="Open pull requests">
        <PullRequestBoardSkeleton />
      </Section>

      <Section title="Recently merged">
        <MergedPullRequestListSkeleton />
      </Section>
    </main>
  );
}
