"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  dashboardQueryOptions,
  impactQueryOptions,
} from "@/_pages/dashboard/api/dashboardQuery";
import { DashboardQueryError } from "@/_pages/dashboard/api/fetchDashboard";
import { dashboardView } from "@/_pages/dashboard/lib/dashboardView";
import { useLastPaired } from "@/_pages/dashboard/lib/useLastPaired";
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
import { scoringKeys } from "@/entities/repo";
import { ROUTES } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";
import { Banner } from "@/shared/ui/banner";
import { RefreshIcon } from "@/shared/ui/icon";

const TOP_REPOS = 10;

function label(
  dict: Dictionary,
  isFetching: boolean,
  isPlaceholderData: boolean,
) {
  if (isPlaceholderData) return dict.dashboard.loading;
  return isFetching ? dict.dashboard.refreshing : dict.dashboard.refresh;
}

export function DashboardContent({
  initialParams,
  dict,
}: {
  initialParams: ScopeParams;
  dict: Dictionary;
}) {
  const [params, selectScope] = useScopeParams(initialParams, ROUTES.dashboard);
  const queryClient = useQueryClient();

  const core = useQuery(dashboardQueryOptions(params.range));

  /** 점수를 물을 목록은 핵심 데이터의 꼬리표에서 나온다. 아직 없으면 무엇을 물을지 모른다. */
  const keys = useMemo(
    () =>
      core.data
        ? scoringKeys(
            [
              ...core.data.repos,
              ...core.data.openPullRequests,
              ...core.data.mergedPullRequests,
            ].map((item) => item.scoring),
          )
        : null,
    [core.data],
  );
  const impact = useQuery(impactQueryOptions(params.range, keys));

  /**
   * 두 조회의 짝이 맞을 때만 화면을 만든다.
   *
   * 물어본 이름이 점수표에 모두 들어 있어야 짝이다 — 다른 기간의 점수표가 placeholder로
   * 남아 있는 동안을 이 검사가 걸러낸다. 짝이 아직 아니면 `useLastPaired`가 직전 화면을
   * 붙들어 준다.
   */
  const paired = useMemo(() => {
    if (!core.data || !impact.data || !keys) return null;
    const scorecards = new Map(impact.data);
    if (!keys.every((key) => scorecards.has(key))) return null;
    return dashboardView(core.data, scorecards);
  }, [core.data, impact.data, keys]);

  const view = useLastPaired(paired);

  const error = core.error ?? impact.error;
  const isFetching = core.isFetching || impact.isFetching;
  /** 자리는 잡혀 있지만 지금 보이는 것이 이 조회 조건의 결과가 아닌 상태 */
  const isPlaceholderData = core.isPlaceholderData || paired === null;

  /** 탭에 포인터가 닿는 순간 그 범위를 미리 받아 둔다. 이미 있으면 아무 일도 하지 않는다. */
  const prefetchScope = ({ range }: ScopeParams) =>
    void queryClient.prefetchQuery(dashboardQueryOptions(range));

  /** 새로고침은 둘 다 다시 받는다. 점수표의 조회 키는 기간뿐이라 저절로 따라오지 않는다. */
  const refetch = () => void Promise.all([core.refetch(), impact.refetch()]);

  if (error instanceof DashboardQueryError && error.status === 401) {
    return (
      <ErrorScreen
        title={dict.dashboard.sessionExpired.title}
        body={dict.dashboard.sessionExpired.body}
        action={dict.dashboard.sessionExpired.action}
        href={ROUTES.login}
      />
    );
  }

  if (!view) {
    if (error) {
      return (
        <ErrorScreen
          title={dict.dashboard.loadFailed.title}
          body={errorMessage(error, dict.dashboard.unknownError)}
          action={dict.dashboard.loadFailed.action}
          href={scopeHref(params, {}, ROUTES.dashboard)}
        />
      );
    }
    return <DashboardLoading />;
  }

  const { viewer, repos, openPullRequests, mergedPullRequests } = view;

  const visibleRepos = filterByScope(repos, params.showAll);
  const visibleOpen = filterByScope(openPullRequests, params.showAll);
  const visibleMerged = filterByScope(mergedPullRequests, params.showAll);

  const filteredAway = (
    template: string,
    total: number,
  ): { emptyMessage?: string } =>
    total > 0 ? { emptyMessage: interpolate(template, { count: total }) } : {};

  const warnings = [
    error ? errorMessage(error, dict.dashboard.refreshFailed) : null,
    view.contributionsWarning,
    view.pullRequestsError,
  ].filter((warning): warning is string => Boolean(warning));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {viewer.name ?? viewer.login}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <LiveScopeTabs
            params={params}
            path={ROUTES.dashboard}
            dict={dict}
            inPlace={{ select: selectScope, prefetch: prefetchScope }}
          />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
            disabled={isFetching}
            onClick={refetch}
          >
            {/* 불러오는 동안에는 아이콘이 돈다. 움직임을 꺼 둔 사용자에게는 멈춰 있는다. */}
            <RefreshIcon
              className={isFetching ? "motion-safe:animate-spin" : ""}
            />
            {label(dict, isFetching, isPlaceholderData)}
          </button>
        </div>
      </div>

      {/* 아직 못 받은 범위를 기다리는 중이면 직전 범위를 흐려 둔다. 자리는 그대로다. */}
      <div
        aria-busy={isPlaceholderData}
        className={`transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}
      >
        <DashboardStats
          totals={view.totals}
          notable={view.notable}
          external={view.external}
          openCount={params.showAll ? view.openCount : visibleOpen.length}
          staleCount={visibleOpen.filter((pr) => pr.isStale).length}
          mergedCount={visibleMerged.length}
          dict={dict}
        />

        {warnings.map((warning) => (
          <Banner key={warning} className="mt-6">
            {warning}
          </Banner>
        ))}

        <Section title={`Contributions · ${dict.ranges[params.range]}`}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <ContributionQuilt weeks={view.weeks} />
          </div>
        </Section>

        <Section title="Repositories">
          <RepoTable
            repos={
              params.showAll ? visibleRepos.slice(0, TOP_REPOS) : visibleRepos
            }
            dict={dict}
            {...filteredAway(dict.dashboard.filteredAway.repos, repos.length)}
          />
        </Section>

        <Section title="Open pull requests">
          <PullRequestBoard
            pullRequests={visibleOpen}
            dict={dict}
            {...filteredAway(
              dict.dashboard.filteredAway.open,
              openPullRequests.length,
            )}
          />
        </Section>

        <Section title="Recently merged">
          <MergedPullRequestList
            pullRequests={visibleMerged}
            dict={dict}
            {...filteredAway(
              dict.dashboard.filteredAway.merged,
              mergedPullRequests.length,
            )}
          />
        </Section>
      </div>
    </main>
  );
}
