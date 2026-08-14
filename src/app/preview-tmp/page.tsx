import { ContributionQuilt } from "@/components/contribution-quilt";
import { MergedPullRequests } from "@/components/pull-request-board";
import { RangeTabs } from "@/components/range-tabs";
import { RepoTable } from "@/components/repo-table";
import { ScopeTabs } from "@/components/scope-tabs";
import { mergeCalendars, type PullRequest, type RepoStat } from "@/lib/github";

const day = 86400000;
const now = Date.parse("2026-08-14T00:00:00Z");

function collection(years: number) {
  let seed = 11;
  const weeks: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }[] = [];
  const start = new Date(now - years * 365 * day);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  for (let w = 0; w < Math.ceil((years * 365) / 7) + 1; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const roll = seed % 100;
      const date = new Date(start.getTime() + (w * 7 + d) * day);
      if (date.getTime() > now) break;
      days.push({ date: date.toISOString().slice(0, 10), contributionCount: roll < 45 ? 0 : roll < 75 ? 1 + (roll % 3) : roll < 92 ? 4 + (roll % 5) : 11 + (roll % 9), weekday: d });
    }
    if (days.length) weeks.push({ contributionDays: days });
  }
  return { contributionCalendar: { weeks } } as never;
}

const repos: RepoStat[] = [
  { nameWithOwner: "vercel/next.js", url: "#", ownerAvatarUrl: "https://github.com/vercel.png?size=64", isPrivate: false, isExternal: true, impact: 100, commits: 42, pullRequests: 7, reviews: 12, issues: 3, total: 64 },
  { nameWithOwner: "prisma/prisma", url: "#", ownerAvatarUrl: "https://github.com/prisma.png?size=64", isPrivate: false, isExternal: true, impact: 93, commits: 9, pullRequests: 3, reviews: 5, issues: 2, total: 19 },
  { nameWithOwner: "rust-lang/rust", url: "#", ownerAvatarUrl: "https://github.com/rust-lang.png?size=64", isPrivate: false, isExternal: true, impact: 97, commits: 4, pullRequests: 2, reviews: 1, issues: 1, total: 8 },
];

const merged: PullRequest[] = [
  { number: 8009, title: "test: 라우터 프리페치 회귀 테스트", url: "#", isDraft: false, updatedAt: new Date(now - 30 * day).toISOString(), mergedAt: new Date(now - 30 * day).toISOString(), reviewDecision: "APPROVED", checkState: "SUCCESS", repo: "vercel/next.js", repoUrl: "#", ownerAvatarUrl: "https://github.com/vercel.png?size=64", isPrivate: false, isExternal: true, impact: 100, isStale: false },
  { number: 401, title: "fix: 빈 캘린더에서 스트릭이 NaN이 되는 문제", url: "#2", isDraft: false, updatedAt: new Date(now - 60 * day).toISOString(), mergedAt: new Date(now - 60 * day).toISOString(), reviewDecision: "APPROVED", checkState: "SUCCESS", repo: "rust-lang/rust", repoUrl: "#", ownerAvatarUrl: "https://github.com/rust-lang.png?size=64", isPrivate: false, isExternal: true, impact: 97, isStale: false },
];

export default function P() {
  const oneYear = mergeCalendars([collection(1)]);
  const fiveYears = mergeCalendars([collection(5)]);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">김소희</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ScopeTabs range="5y" showAll={false} />
          <RangeTabs current="5y" showAll={false} />
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-muted">Contributions · 1년 ({oneYear.length}주)</h2>
      <div className="rounded-xl border border-border bg-surface p-4"><ContributionQuilt weeks={oneYear} /></div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-muted">Contributions · 5년 ({fiveYears.length}주)</h2>
      <div className="rounded-xl border border-border bg-surface p-4"><ContributionQuilt weeks={fiveYears} /></div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-muted">Repositories</h2>
      <RepoTable repos={repos} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-muted">Recently merged</h2>
      <MergedPullRequests pullRequests={merged} />
    </main>
  );
}
