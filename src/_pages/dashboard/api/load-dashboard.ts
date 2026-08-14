import {
  aggregateRepos,
  fetchContributions,
  mergeCalendars,
  type CalendarDay,
} from "@/entities/contribution";
import {
  EMPTY_PULL_REQUESTS,
  fetchPullRequests,
  type PullRequest,
  type PullRequestBoardData,
} from "@/entities/pull-request";
import { isNotable, loadScorecards, withImpact, type RepoStat } from "@/entities/repo";
import { GitHubAuthError, type GitHubViewer } from "@/shared/api";
import { rangeStartDate, windowsFor, type RangeKey } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { percent } from "@/shared/lib/format";

export type DashboardData = {
  viewer: GitHubViewer;
  totals: { contributions: number; restricted: number };
  external: { contributions: number; ratio: number };
  /** 주요 OSS이면서 내 소유가 아닌 Repository에 대한 기여 */
  notable: { repos: number; contributions: number };
  weeks: CalendarDay[][];
  repos: RepoStat[];
  openPullRequests: PullRequest[];
  mergedPullRequests: PullRequest[];
  openCount: number;
  /** PR 조회만 실패한 경우의 사유. 나머지 지표는 정상이다. */
  pullRequestsError: string | null;
  /** 여러 해를 나눠 부를 때 일부 구간만 실패한 경우의 안내. */
  contributionsWarning: string | null;
};

/** 실패해도 흐름을 끊지 않도록 결과를 값으로 바꿔 둔다. */
type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

function toOutcome<T>(promise: Promise<T>): Promise<Outcome<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
}

const loadedOf = <T>(outcome: Outcome<T>): outcome is { ok: true; value: T } => outcome.ok;
const failureOf = <T>(outcome: Outcome<T>): outcome is { ok: false; error: unknown } =>
  !outcome.ok;

/**
 * 대시보드 한 화면에 필요한 모든 것을 모은다.
 *
 * 기여 집계는 화면의 뼈대라 전부 실패하면 그릴 것이 없지만, 일부 구간만 실패하면
 * 남은 구간으로 그리고 경고를 붙인다. PR 조회는 곁가지라 실패해도 그 구역만 비운다.
 * 어느 쪽이든 토큰이 죽은 것이라면 다시 로그인해야 하므로 그대로 올린다.
 */
export async function loadDashboard(token: string, range: RangeKey): Promise<DashboardData> {
  const now = Date.now();
  const windows = windowsFor(range, now);

  const contributionsOutcomes = Promise.all(
    windows.map((window, index) =>
      toOutcome(
        fetchContributions(
          token,
          window,
          windows.length > 1 ? `기여 집계 ${index + 1}/${windows.length}` : "기여 집계",
        ),
      ),
    ),
  );
  const pullRequestsOutcome = toOutcome(
    fetchPullRequests(token, rangeStartDate(range, now), now),
  );

  const [contributions, pullRequests] = await Promise.all([
    contributionsOutcomes,
    pullRequestsOutcome,
  ]);

  for (const outcome of [...contributions, pullRequests]) {
    if (!outcome.ok && outcome.error instanceof GitHubAuthError) throw outcome.error;
  }

  const loaded = contributions.filter(loadedOf);
  const failures = contributions.filter(failureOf);
  // 기여 집계는 대시보드의 뼈대라 전부 실패하면 렌더할 것이 없다.
  if (loaded.length === 0) throw failures[0]!.error;

  const board: PullRequestBoardData = pullRequests.ok ? pullRequests.value : EMPTY_PULL_REQUESTS;
  const pullRequestsError = pullRequests.ok
    ? null
    : errorMessage(pullRequests.error, "PR을 불러오지 못했습니다.");

  const viewer = loaded[0]!.value.viewer;
  const collections = loaded.map((outcome) => outcome.value.collection);

  const weeks = mergeCalendars(collections);

  // 점수는 deps.dev의 OpenSSF Scorecard에서 온다. repository와 PR이 가리키는 곳을 모아
  // 한 번에 물어본 뒤 세 목록에 같은 결과를 나눠 준다.
  const tallies = aggregateRepos(collections, viewer.login);
  const scorecards = await loadScorecards(
    [...tallies, ...board.open, ...board.merged].map((item) => item.scoring),
  );

  const repos = tallies.map((tally) => withImpact<RepoStat>(tally, scorecards));

  const externalRepos = repos.filter((repo) => repo.isExternal);
  const externalContributions = externalRepos.reduce((sum, repo) => sum + repo.total, 0);
  const allContributions = repos.reduce((sum, repo) => sum + repo.total, 0);
  const notableRepos = externalRepos.filter((repo) => isNotable(repo.impact));

  return {
    viewer,
    totals: {
      // 창 경계의 중복을 이미 걷어낸 달력에서 세는 편이 합계를 두 번 더하지 않는다.
      contributions: weeks.flat().reduce((sum, day) => sum + day.count, 0),
      restricted: collections.reduce((sum, c) => sum + c.restrictedContributionsCount, 0),
    },
    external: {
      contributions: externalContributions,
      ratio: percent(externalContributions, allContributions),
    },
    notable: {
      repos: notableRepos.length,
      contributions: notableRepos.reduce((sum, repo) => sum + repo.total, 0),
    },
    weeks,
    repos,
    openPullRequests: board.open.map((pr) => withImpact<PullRequest>(pr, scorecards)),
    mergedPullRequests: board.merged.map((pr) => withImpact<PullRequest>(pr, scorecards)),
    openCount: board.openCount,
    pullRequestsError,
    // 여러 해를 나눠 부르는 경우, 일부 구간만 실패하면 나머지로 그린다.
    contributionsWarning:
      failures.length > 0
        ? `${windows.length}개 구간 중 ${failures.length}개를 불러오지 못해 일부 기간이 빠져 있습니다.`
        : null,
  };
}
