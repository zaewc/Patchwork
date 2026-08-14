"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/_pages/dashboard/api/dashboard-query";
import { DashboardQueryError } from "@/_pages/dashboard/api/fetch-dashboard";
import { ContributionQuilt } from "@/_pages/dashboard/ui/contribution-quilt";
import { DashboardLoading } from "@/_pages/dashboard/ui/dashboard-loading";
import { DashboardStats } from "@/_pages/dashboard/ui/dashboard-stats";
import { ErrorScreen } from "@/_pages/dashboard/ui/error-screen";
import { MergedPullRequestList } from "@/_pages/dashboard/ui/merged-pull-request-list";
import { PullRequestBoard } from "@/_pages/dashboard/ui/pull-request-board";
import { RepoTable } from "@/_pages/dashboard/ui/repo-table";
import { Section } from "@/_pages/dashboard/ui/section";
import { filterByScope, ScopeTabs, scopeHref, type ScopeParams } from "@/features/contribution-scope";
import { SiteHeader } from "@/widgets/site-header";
import { RANGES, ROUTES } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { Banner } from "@/shared/ui/banner";

/** 전체 보기에서만 목록을 자른다. 주요 OSS 모드는 이미 걸러진 목록이라 다 보여준다. */
const TOP_REPOS = 10;

export function DashboardContent({ params }: { params: ScopeParams }) {
  const { data, error, isFetching, refetch } = useQuery(dashboardQueryOptions(params.range));

  if (error instanceof DashboardQueryError && error.status === 401) {
    return (
      <ErrorScreen
        title="세션이 만료되었습니다"
        body="GitHub 토큰이 더 이상 유효하지 않습니다."
        action="다시 로그인"
        href={ROUTES.login}
      />
    );
  }

  if (!data) {
    if (error) {
      return (
        <ErrorScreen
          title="데이터를 불러오지 못했습니다"
          body={errorMessage(error, "알 수 없는 오류가 발생했습니다.")}
          action="다시 시도"
          href={scopeHref(params, {}, ROUTES.dashboard)}
        />
      );
    }
    return <DashboardLoading />;
  }

  const { viewer, repos, openPullRequests, mergedPullRequests } = data;

  const visibleRepos = filterByScope(repos, params.showAll);
  const visibleOpen = filterByScope(openPullRequests, params.showAll);
  const visibleMerged = filterByScope(mergedPullRequests, params.showAll);

  /** 필터 때문에 목록이 통째로 빈 경우의 안내. 원래 비어 있으면 각 컴포넌트의 기본 문구를 쓴다. */
  const filteredAway = (noun: string, unit: string, total: number) =>
    total > 0
      ? `${noun} ${total}${unit}이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.`
      : undefined;

  const warnings = [
    error ? errorMessage(error, "데이터를 새로 불러오지 못했습니다.") : null,
    data.contributionsWarning,
    data.pullRequestsError,
  ].filter((warning): warning is string => Boolean(warning));

  return (
    <>
      <SiteHeader user={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{viewer.name ?? viewer.login}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeTabs params={params} path={ROUTES.dashboard} />
            <button
              type="button"
              className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? "새로고침 중…" : "새로고침"}
            </button>
          </div>
        </div>

        <DashboardStats
          totals={data.totals}
          notable={data.notable}
          external={data.external}
          openCount={params.showAll ? data.openCount : visibleOpen.length}
          staleCount={visibleOpen.filter((pr) => pr.isStale).length}
          mergedCount={visibleMerged.length}
        />

        {warnings.map((warning) => (
          <Banner key={warning} className="mt-6">
            {warning}
          </Banner>
        ))}

        <Section title={`Contributions · ${RANGES[params.range].label}`}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <ContributionQuilt weeks={data.weeks} />
          </div>
        </Section>

        <Section title="Repositories">
          <RepoTable
            repos={params.showAll ? visibleRepos.slice(0, TOP_REPOS) : visibleRepos}
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
          <MergedPullRequestList
            pullRequests={visibleMerged}
            emptyMessage={filteredAway("merge된 pull request", "건", mergedPullRequests.length)}
          />
        </Section>
      </main>
    </>
  );
}
