"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  dashboardQueryOptions,
  impactQueryOptions,
} from "@/_pages/dashboard/api/dashboardQuery";
import { DashboardQueryError } from "@/_pages/dashboard/api/fetchDashboard";
import { dashboardView } from "@/_pages/dashboard/lib/dashboardView";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";
import { DashboardHero } from "@/_pages/dashboard/ui/DashboardHero";
import { DashboardStats } from "@/_pages/dashboard/ui/DashboardStats";
import { ErrorScreen } from "@/_pages/dashboard/ui/ErrorScreen";
import { MergedPullRequestList } from "@/_pages/dashboard/ui/MergedPullRequestList";
import { MergedPullRequestListSkeleton } from "@/_pages/dashboard/ui/MergedPullRequestListSkeleton";
import { PullRequestBoard } from "@/_pages/dashboard/ui/PullRequestBoard";
import { PullRequestBoardSkeleton } from "@/_pages/dashboard/ui/PullRequestBoardSkeleton";
import { RepoTable } from "@/_pages/dashboard/ui/RepoTable";
import { RepoTableSkeleton } from "@/_pages/dashboard/ui/RepoTableSkeleton";
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

/** 전체 보기에서만 목록을 자른다. 주요 OSS 모드는 이미 걸러진 목록이라 다 보여준다. */
const TOP_REPOS = 10;

/** 같은 버튼이 두 가지를 기다린다. 지금 보고 있는 것을 다시 받는 중인지, 다른 범위를 받는 중인지. */
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
   * 점수까지 짝이 맞은 화면. 아직 아니면 null이고, 점수가 필요한 구역만 자리를 잡는다.
   *
   * 물어본 이름이 점수표에 모두 들어 있어야 짝이다 — 다른 기간의 점수표가 placeholder로
   * 남아 있는 동안을 이 검사가 걸러낸다. 짝이 아닌 점수로 목록을 걸러 내면 그 기간에 없는
   * 줄이 잠깐 보인다.
   */
  const view = useMemo(() => {
    if (!core.data || !impact.data || !keys) return null;
    const scorecards = new Map(impact.data);
    if (!keys.every((key) => scorecards.has(key))) return null;
    return dashboardView(core.data, scorecards);
  }, [core.data, impact.data, keys]);

  const error = core.error ?? impact.error;
  const isFetching = core.isFetching || impact.isFetching;

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

  // 기여 집계가 없으면 조회 조건도 사용자 이름도 몰라 그릴 골격이 없다.
  if (!core.data) {
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

  const { viewer, weeks, totals, external, openCount } = core.data;

  /** 점수가 있어야 걸러낼 수 있는 세 목록. 아직이면 각 구역이 자기 자리를 잡는다. */
  const scoped = view
    ? {
        repos: filterByScope(view.repos, params.showAll),
        open: filterByScope(view.openPullRequests, params.showAll),
        merged: filterByScope(view.mergedPullRequests, params.showAll),
        /** 걸러내기 전의 수. "전체로 전환하면 볼 수 있다"고 안내할 때 쓴다. */
        before: {
          repos: view.repos.length,
          open: view.openPullRequests.length,
          merged: view.mergedPullRequests.length,
        },
      }
    : null;

  /** 필터 때문에 목록이 통째로 빈 경우의 안내. 원래 비어 있으면 각 컴포넌트의 기본 문구를 쓴다. */
  const filteredAway = (
    template: string,
    total: number,
  ): { emptyMessage?: string } =>
    total > 0 ? { emptyMessage: interpolate(template, { count: total }) } : {};

  const warnings = [
    error ? errorMessage(error, dict.dashboard.refreshFailed) : null,
    core.data.contributionsWarning,
    core.data.pullRequestsError,
  ].filter((warning): warning is string => Boolean(warning));

  const actions = (
    <>
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
        <RefreshIcon className={isFetching ? "motion-safe:animate-spin" : ""} />
        {label(dict, isFetching, core.isPlaceholderData)}
      </button>
    </>
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {/*
        아직 못 받은 범위를 기다리는 중이면 직전 범위를 흐려 둔다. 자리는 그대로다.
        점수를 기다리는 것은 여기서 흐리지 않는다 — 그것은 구역마다 자기 자리로 알린다.
      */}
      <div
        aria-busy={core.isPlaceholderData}
        className={`transition-opacity ${core.isPlaceholderData ? "opacity-50" : ""}`}
      >
        <DashboardHero
          viewer={viewer}
          totals={totals}
          weeks={weeks}
          rangeLabel={dict.ranges[params.range]}
          dict={dict}
          actions={actions}
        />

        <DashboardStats
          notable={view?.notable ?? null}
          external={external}
          // 전체 모드의 열린 PR 수는 GitHub이 준 값이라 점수를 기다리지 않는다.
          openCount={params.showAll ? openCount : (scoped?.open.length ?? null)}
          staleCount={
            scoped ? scoped.open.filter((pr) => pr.isStale).length : null
          }
          mergedCount={scoped?.merged.length ?? null}
          dict={dict}
        />

        {warnings.map((warning) => (
          <Banner key={warning} className="mt-6">
            {warning}
          </Banner>
        ))}

        <Section title="Repositories">
          {scoped ? (
            <RepoTable
              repos={
                params.showAll ? scoped.repos.slice(0, TOP_REPOS) : scoped.repos
              }
              dict={dict}
              {...filteredAway(
                dict.dashboard.filteredAway.repos,
                scoped.before.repos,
              )}
            />
          ) : (
            <RepoTableSkeleton />
          )}
        </Section>

        <Section title="Open pull requests">
          {scoped ? (
            <PullRequestBoard
              pullRequests={scoped.open}
              dict={dict}
              {...filteredAway(
                dict.dashboard.filteredAway.open,
                scoped.before.open,
              )}
            />
          ) : (
            <PullRequestBoardSkeleton />
          )}
        </Section>

        <Section title="Recently merged">
          {scoped ? (
            <MergedPullRequestList
              pullRequests={scoped.merged}
              dict={dict}
              {...filteredAway(
                dict.dashboard.filteredAway.merged,
                scoped.before.merged,
              )}
            />
          ) : (
            <MergedPullRequestListSkeleton />
          )}
        </Section>
      </div>
    </main>
  );
}
