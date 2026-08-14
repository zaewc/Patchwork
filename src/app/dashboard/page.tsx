import { redirect } from "next/navigation";
import { ContributionQuilt } from "@/components/contribution-quilt";
import { MergedPullRequests, PullRequestBoard } from "@/components/pull-request-board";
import { RangeTabs } from "@/components/range-tabs";
import { ScopeTabs } from "@/components/scope-tabs";
import { RepoTable } from "@/components/repo-table";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/format";
import {
  fetchDashboard,
  GitHubAuthError,
  parseRange,
  RANGES,
  type DashboardData,
} from "@/lib/github";
import { isNotable } from "@/lib/impact";
import { getSession } from "@/lib/session";

const TOP_REPOS = 10;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

function ErrorScreen({ title, body, retry, href }: Record<"title" | "body" | "retry" | "href", string>) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-24 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <a
          href={href}
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {retry}
        </a>
      </main>
    </>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const range = parseRange(params.range);
  // 기본은 주요 OSS 이상만. 일반 프로젝트까지 보려면 ?scope=all
  const showAll = params.scope === "all";

  let data: DashboardData;
  try {
    data = await fetchDashboard(session.token, range);
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return (
        <ErrorScreen
          title="세션이 만료되었습니다"
          body="GitHub 토큰이 더 이상 유효하지 않습니다."
          retry="다시 로그인"
          href="/api/auth/login"
        />
      );
    }
    return (
      <ErrorScreen
        title="데이터를 불러오지 못했습니다"
        body={error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
        retry="다시 시도"
        href={`/dashboard?range=${range}`}
      />
    );
  }

  const { viewer, totals, external, notable, repos, openPullRequests, mergedPullRequests } = data;
  // 주요 OSS 모드에서는 세 목록 모두 같은 기준으로 걸러 화면이 어긋나지 않게 한다.
  const keep = <T extends { impact: number }>(items: T[]) =>
    showAll ? items : items.filter((item) => isNotable(item.impact));

  const visibleRepos = keep(repos);
  const visibleOpen = keep(openPullRequests);
  const visibleMerged = keep(mergedPullRequests);
  const staleCount = visibleOpen.filter((pr) => pr.isStale).length;
  const notNotable = "주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.";

  return (
    <>
      <SiteHeader user={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{viewer.name ?? viewer.login}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeTabs range={range} showAll={showAll} />
            <RangeTabs current={range} showAll={showAll} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Contributions"
            value={totals.contributions}
            hint={totals.restricted > 0 ? `Private ${formatNumber(totals.restricted)}건 포함` : undefined}
          />
          <StatCard
            label="주요 OSS 기여"
            value={notable.contributions}
            hint={`repository ${notable.repos}곳`}
            accent
          />
          <StatCard
            label="외부 Repository 기여"
            value={external.contributions}
            hint={`전체의 ${external.ratio}%`}
          />
          <StatCard
            label="Open pull requests"
            value={showAll ? data.openCount : visibleOpen.length}
            hint={staleCount > 0 ? `Stale ${staleCount}건` : `Merged ${visibleMerged.length}건`}
          />
        </div>

        {data.contributionsWarning ? (
          <p className="mt-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-warn">
            {data.contributionsWarning}
          </p>
        ) : null}

        {data.pullRequestsError ? (
          <p className="mt-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-warn">
            Pull request 목록만 불러오지 못했습니다 — {data.pullRequestsError}
          </p>
        ) : null}

        <Section title={`Contributions · ${RANGES[range].label}`}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <ContributionQuilt weeks={data.weeks} />
          </div>
        </Section>

        <Section title="Open pull requests">
          <PullRequestBoard
            pullRequests={visibleOpen}
            emptyMessage={
              openPullRequests.length > 0
                ? `열린 pull request ${openPullRequests.length}건이 모두 ${notNotable}`
                : undefined
            }
          />
        </Section>

        <Section title="Repositories">
          <RepoTable
            repos={visibleRepos.slice(0, TOP_REPOS)}
            emptyMessage={
              repos.length > 0 ? `기여한 repository ${repos.length}곳이 모두 ${notNotable}` : undefined
            }
          />
        </Section>

        <Section title="Recently merged">
          <MergedPullRequests
            pullRequests={visibleMerged}
            emptyMessage={
              mergedPullRequests.length > 0
                ? `merge된 pull request ${mergedPullRequests.length}건이 모두 ${notNotable}`
                : undefined
            }
          />
        </Section>
      </main>
    </>
  );
}
