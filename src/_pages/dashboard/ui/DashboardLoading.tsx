import { Section } from "@/_pages/dashboard/ui/Section";

/** 퀼트 격자의 요일 행 수. 실제 퀼트와 같은 세로 치수를 잡으려고 맞춘다. */
const QUILT_ROWS = 7;
/** 목록 길이는 조회 범위에 따라 다르다. 흔한 화면에 가깝게 다섯 줄만 잡아 둔다. */
const LIST_ROWS = 5;
/** 검토 상태별 열 넷과 열마다 놓을 카드 수 */
const BOARD_COLUMNS = 4;
const BOARD_CARDS = 2;
const STAT_CARDS = 4;

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />;
}

/**
 * 데이터를 기다리는 동안 실제 화면과 같은 자리에 자리만 잡아 둔다.
 *
 * 두 가지를 지킨다.
 *
 * 하나, **이미 아는 것은 가리지 않는다.** 머리는 `DashboardLayout`이 세션만으로 그려
 * 두었으므로 손대지 않고, 구역 제목처럼 언어와 무관한 골격 라벨은 회색 덩이로 덮지
 * 않고 그대로 적는다. 데이터가 없어도 아는 것을 가리는 것은 스켈레톤의 일이 아니다.
 *
 * 둘, **자리는 실제 껍데기로 잡는다.** 카드·표·보드의 테두리와 여백은 실제 컴포넌트와
 * 같은 클래스를 쓰고 글자 자리만 비운다. 높이를 손으로 계산해 두면 실제 화면이 바뀔 때
 * 조용히 어긋나고, 도착하는 순간 화면이 튄다.
 */
export function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Block className="h-7 w-40 rounded-md" />
        {/* 범위 탭 둘과 새로고침 버튼. 어느 조건을 보고 있는지 모르는 자리라 자리만 잡는다. */}
        <div className="flex flex-wrap items-center gap-2">
          <Block className="h-9.5 w-32 rounded-lg" />
          <Block className="h-9.5 w-52 rounded-lg" />
          <Block className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: STAT_CARDS }, (_, card) => (
          <div
            key={card}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <Block className="h-4 w-24 rounded" />
            <Block className="mt-1 h-8 w-20 rounded" />
            <Block className="mt-1 h-4 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* 조회 범위는 아직 모르므로 제목에 기간을 덧붙이지 않는다. */}
      <Section title="Contributions">
        <div className="rounded-xl border border-border bg-surface p-4">
          <Block className="h-4 w-48 rounded" />
          <div className="flex flex-col gap-[3px]">
            {Array.from({ length: QUILT_ROWS }, (_, row) => (
              <Block key={row} className="h-3 rounded-sm" />
            ))}
          </div>
          <Block className="mt-3 h-4 w-40 rounded" />
        </div>
      </Section>

      <Section title="Repositories">
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-2">
            <Block className="h-4 rounded" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: LIST_ROWS }, (_, row) => (
              <div key={row} className="px-4 py-2.5">
                <Block className="h-5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Open pull requests">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: BOARD_COLUMNS }, (_, column) => (
            <div key={column}>
              <Block className="mb-2 h-5 w-32 rounded" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: BOARD_CARDS }, (_, card) => (
                  <div
                    key={card}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <Block className="h-3.5 w-24 rounded" />
                    <Block className="mt-1 h-5 rounded" />
                    <Block className="mt-2 h-3.5 w-20 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recently merged">
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {Array.from({ length: LIST_ROWS }, (_, row) => (
            <div key={row} className="px-4 py-2.5">
              <Block className="h-5 rounded" />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
