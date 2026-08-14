import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { ContributionQuilt } from "@/components/contribution-quilt";
import { MergedPullRequests, PullRequestBoard } from "@/components/pull-request-board";
import { RepoTable } from "@/components/repo-table";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { TabBar } from "@/components/tab-bar";
import { dashboardHref, parseDashboardParams } from "@/lib/dashboard-params";
import { formatNumber } from "@/lib/format";
import {
  fetchDashboard,
  GitHubAuthError,
  RANGES,
  type DashboardData,
  type RangeKey,
} from "@/lib/github";
import { isNotable } from "@/lib/impact";
import { getSession } from "@/lib/session";

/** 전체 보기에서만 목록을 자른다. 주요 OSS 모드는 이미 걸러진 목록이라 다 보여준다. */
const TOP_REPOS = 10;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

function ErrorScreen({
  title,
  body,
  retry,
  href,
}: {
  title: string;
  body: string;
  retry: string;
  href: string;
}) {
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

  const params = parseDashboardParams(await searchParams);
  const { range, showAll } = params;

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
        href={dashboardHref(params)}
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

  /** 필터 때문에 목록이 통째로 빈 경우의 안내. 원래 비어 있으면 각 컴포넌트의 기본 문구를 쓴다. */
  const filteredAway = (noun: string, unit: string, total: number) =>
    total > 0
      ? `${noun} ${total}${unit}이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.`
      : undefined;

  const warnings = [data.contributionsWarning, data.pullRequestsError].filter(
    (warning): warning is string => Boolean(warning),
  );

  return (
    <>
      <SiteHeader user={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{viewer.name ?? viewer.login}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <TabBar
              items={[false, true].map((all) => ({
                href: dashboardHref(params, { showAll: all }),
                label: all ? "전체" : "주요 OSS",
                active: all === showAll,
              }))}
            />
            <TabBar
              items={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
                href: dashboardHref(params, { range: key }),
                label: RANGES[key].label,
                active: key === range,
              }))}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Contributions"
            value={totals.contributions}
            hint={
              totals.restricted > 0 ? `Private ${formatNumber(totals.restricted)}건 포함` : undefined
            }
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

        {warnings.map((warning) => (
          <Banner key={warning} className="mt-6">
            {warning}
          </Banner>
        ))}

        <Section title={`Contributions · ${RANGES[range].label}`}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <ContributionQuilt weeks={data.weeks} />
          </div>
        </Section>

        <Section title="Repositories">
          <RepoTable
            repos={showAll ? visibleRepos.slice(0, TOP_REPOS) : visibleRepos}
            emptyMessage={filteredAway("기여한 repository", "곳", repos.length)}
          />
        </Section>

        <Section title="Open pull requests">
          <PullRequestBoard
            pullRequests={visibleOpen}
            emptyMessage={filteredAway("열린 pull request", "건", openPullRequests.length)}
          />
        </Section>

        <Section title="Recently merged">
          <MergedPullRequests
            pullRequests={visibleMerged}
            emptyMessage={filteredAway("merge된 pull request", "건", mergedPullRequests.length)}
          />
        </Section>
      </main>
    </>
  );
}
