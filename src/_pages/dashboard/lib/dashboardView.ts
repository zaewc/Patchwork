import type { DashboardCore } from "@/_pages/dashboard/api/loadDashboard";
import type { PullRequest } from "@/entities/pull-request";
import {
  isNotable,
  withImpact,
  type RepoStat,
  type ScorecardIndex,
} from "@/entities/repo";

/** 점수표까지 도착해 화면이 그대로 그릴 수 있는 모양 */
export type DashboardView = Omit<
  DashboardCore,
  "repos" | "openPullRequests" | "mergedPullRequests"
> & {
  repos: RepoStat[];
  openPullRequests: PullRequest[];
  mergedPullRequests: PullRequest[];
  /** 주요 OSS이면서 내 소유가 아닌 Repository에 대한 기여 */
  notable: { repos: number; contributions: number };
};

/**
 * 점수 없는 핵심 데이터에 Scorecard를 얹어 화면이 쓸 모양으로 완성한다.
 *
 * 서버가 한 번에 만들어 주던 일을 둘로 나눈 대가로 여기가 생겼다. 순수 함수라 서버와
 * 브라우저 어느 쪽에서도 같은 결과가 나온다.
 */
export function dashboardView(
  core: DashboardCore,
  scorecards: ScorecardIndex,
): DashboardView {
  const repos = core.repos.map((repo) =>
    withImpact<RepoStat>(repo, scorecards),
  );
  const notableRepos = repos.filter(
    (repo) => repo.isExternal && isNotable(repo.impact),
  );

  return {
    ...core,
    repos,
    openPullRequests: core.openPullRequests.map((pr) =>
      withImpact<PullRequest>(pr, scorecards),
    ),
    mergedPullRequests: core.mergedPullRequests.map((pr) =>
      withImpact<PullRequest>(pr, scorecards),
    ),
    notable: {
      repos: notableRepos.length,
      contributions: notableRepos.reduce((sum, repo) => sum + repo.total, 0),
    },
  };
}
