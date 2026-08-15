"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQueryOptions } from "@/_pages/dashboard/api/dashboardQuery";
import { DashboardQueryError } from "@/_pages/dashboard/api/fetchDashboard";
import { ContributionQuilt } from "@/_pages/dashboard/ui/ContributionQuilt";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";
import { DashboardStats } from "@/_pages/dashboard/ui/DashboardStats";
import { ErrorScreen } from "@/_pages/dashboard/ui/ErrorScreen";
import { MergedPullRequestList } from "@/_pages/dashboard/ui/MergedPullRequestList";
import { PullRequestBoard } from "@/_pages/dashboard/ui/PullRequestBoard";
import { RepoTable } from "@/_pages/dashboard/ui/RepoTable";
import { Section } from "@/_pages/dashboard/ui/Section";
import {
  filterByScope,
  LiveScopeTabs,
  scopeHref,
  useScopeParams,
  type ScopeParams,
} from "@/features/contribution-scope";
import { SiteHeader } from "@/widgets/site-header";
import { RANGES, ROUTES } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { Banner } from "@/shared/ui/banner";
import { RefreshIcon } from "@/shared/ui/icon";

/** 전체 보기에서만 목록을 자른다. 주요 OSS 모드는 이미 걸러진 목록이라 다 보여준다. */
const TOP_REPOS = 10;

/** 같은 버튼이 두 가지를 기다린다. 지금 보고 있는 것을 다시 받는 중인지, 다른 범위를 받는 중인지. */
function label(isFetching: boolean, isPlaceholderData: boolean) {
  if (isPlaceholderData) return "불러오는 중…";
  return isFetching ? "새로고침 중…" : "새로고침";
}

export function DashboardContent({
  initialParams,
}: {
  initialParams: ScopeParams;
}) {
  const [params, selectScope] = useScopeParams(initialParams, ROUTES.dashboard);
  const queryClient = useQueryClient();
  const { data, error, isFetching, isPlaceholderData, refetch } = useQuery(
    dashboardQueryOptions(params.range),
  );

  /** 탭에 포인터가 닿는 순간 그 범위를 미리 받아 둔다. 이미 있으면 아무 일도 하지 않는다. */
  const prefetchScope = ({ range }: ScopeParams) =>
    void queryClient.prefetchQuery(dashboardQueryOptions(range));

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
  const filteredAway = (
    noun: string,
    unit: string,
    total: number,
  ): { emptyMessage?: string } =>
    total > 0
      ? {
          emptyMessage: `${noun} ${total}${unit}이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.`,
        }
      : {};

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
          <h1 className="text-xl font-semibold tracking-tight">
            {viewer.name ?? viewer.login}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <LiveScopeTabs
              params={params}
              path={ROUTES.dashboard}
              inPlace={{ select: selectScope, prefetch: prefetchScope }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {/* 불러오는 동안에는 아이콘이 돈다. 움직임을 꺼 둔 사용자에게는 멈춰 있는다. */}
              <RefreshIcon
                className={isFetching ? "motion-safe:animate-spin" : ""}
              />
              {label(isFetching, isPlaceholderData)}
            </button>
          </div>
        </div>

        {/* 아직 못 받은 범위를 기다리는 중이면 직전 범위를 흐려 둔다. 자리는 그대로다. */}
        <div
          aria-busy={isPlaceholderData}
          className={`transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}
        >
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
              repos={
                params.showAll ? visibleRepos.slice(0, TOP_REPOS) : visibleRepos
              }
              {...filteredAway("기여한 repository", "곳", repos.length)}
            />
          </Section>

          <Section title="Open pull requests">
            <PullRequestBoard
              pullRequests={visibleOpen}
              {...filteredAway(
                "열린 pull request",
                "건",
                openPullRequests.length,
              )}
            />
          </Section>

          <Section title="Recently merged">
            <MergedPullRequestList
              pullRequests={visibleMerged}
              {...filteredAway(
                "merge된 pull request",
                "건",
                mergedPullRequests.length,
              )}
            />
          </Section>
        </div>
      </main>
    </>
  );
}
