import type { DashboardCore } from "@/_pages/dashboard/api/loadDashboard";
import type { ImpactEntries } from "@/_pages/dashboard/api/loadImpact";
import type { DashboardView } from "@/_pages/dashboard/lib/dashboardView";
import type { PullRequest } from "@/entities/pull-request";
import type { RepoScoring, RepoStat, Unscored } from "@/entities/repo";

/** 주요 OSS 경계(NOTABLE_MIN = 60) 위/아래를 확실히 가르는 점수 */
export const NOTABLE_IMPACT = 96;
export const PLAIN_IMPACT = 10;

export function repoStat(overrides: Partial<RepoStat> = {}): RepoStat {
  const nameWithOwner = overrides.nameWithOwner ?? "vercel/next.js";
  return {
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    ownerAvatarUrl: `https://avatars.githubusercontent.com/${nameWithOwner.split("/")[0]}`,
    isPrivate: false,
    isExternal: true,
    impact: NOTABLE_IMPACT,
    commits: 10,
    pullRequests: 3,
    reviews: 2,
    issues: 1,
    total: 16,
    ...overrides,
  };
}

export function pullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
  const number = overrides.number ?? 1;
  const repo = overrides.repo ?? "vercel/next.js";
  return {
    number,
    title: `제목 ${number}`,
    url: `https://github.com/${repo}/pull/${number}`,
    isDraft: false,
    updatedAt: "2026-08-14T00:00:00Z",
    mergedAt: null,
    reviewDecision: "REVIEW_REQUIRED",
    checkState: null,
    repo,
    ownerAvatarUrl: `https://avatars.githubusercontent.com/${repo.split("/")[0]}`,
    isPrivate: false,
    impact: NOTABLE_IMPACT,
    isStale: false,
    ...overrides,
  };
}

/**
 * 테스트는 "이 repository의 점수는 얼마"라고 적는 편이 읽기 쉽다. 실제 화면은 점수를 뺀
 * 핵심 데이터와 점수표를 따로 받으므로, 이렇게 적어 둔 뒤 `dashboardFixture`가 둘로 쪼갠다.
 */
export function dashboardData(
  overrides: Partial<DashboardView> = {},
): DashboardView {
  return {
    viewer: {
      login: "octocat",
      name: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
    },
    totals: { contributions: 1234, restricted: 0 },
    external: { contributions: 800, ratio: 65 },
    // vercel/next.js 하나만 주요 OSS다. dashboardFixture가 점수표에서 다시 세므로 맞춰 둔다.
    notable: { repos: 1, contributions: 100 },
    weeks: [[{ date: "2026-08-09", count: 4, weekday: 0 }]],
    repos: [
      repoStat({ nameWithOwner: "vercel/next.js", total: 100 }),
      repoStat({
        nameWithOwner: "someone/toy",
        impact: PLAIN_IMPACT,
        total: 5,
      }),
    ],
    openPullRequests: [
      pullRequest({ number: 1 }),
      pullRequest({ number: 2, repo: "someone/toy", impact: PLAIN_IMPACT }),
    ],
    mergedPullRequests: [
      pullRequest({ number: 9, mergedAt: "2026-08-14T00:00:00Z" }),
    ],
    openCount: 7,
    pullRequestsError: null,
    contributionsWarning: null,
    ...overrides,
  };
}

/**
 * 점수를 되살릴 수 있게 꼬리표를 달아 준다.
 *
 * `signals`는 일부러 늘 공개로 둔다. `scoreRepo`는 비공개면 신호를 보지 않고 0점을 주므로,
 * 점수표에 적어 둔 값이 그대로 되살아나게 하려면 그래야 한다.
 */
const scoringOf = (key: string): RepoScoring => ({
  key,
  signals: { isPrivate: false, stars: 0, forks: 0 },
});

const unscore = <T extends { impact: number }>(
  item: T,
  key: string,
): Unscored<T> => {
  const unscored: Record<string, unknown> = {
    ...item,
    scoring: scoringOf(key),
  };
  delete unscored.impact;
  return unscored as unknown as Unscored<T>;
};

/**
 * 화면이 실제로 받는 두 조각으로 쪼갠다.
 *
 * 점수표에는 `impact / 10`을 적는다. `scoreRepo`가 Scorecard 총점(0~10)을 100점으로
 * 환산하므로 적어 둔 점수가 그대로 되살아난다.
 */
export function dashboardFixture(overrides: Partial<DashboardView> = {}): {
  core: DashboardCore;
  impact: ImpactEntries;
} {
  const view = dashboardData(overrides);
  const { repos, openPullRequests, mergedPullRequests } = view;

  const scores = new Map<string, number | null>();
  for (const [key, impact] of [
    ...repos.map((repo) => [repo.nameWithOwner, repo.impact] as const),
    ...openPullRequests.map((pr) => [pr.repo, pr.impact] as const),
    ...mergedPullRequests.map((pr) => [pr.repo, pr.impact] as const),
  ]) {
    scores.set(key, impact / 10);
  }

  return {
    core: {
      viewer: view.viewer,
      totals: view.totals,
      external: view.external,
      weeks: view.weeks,
      openCount: view.openCount,
      pullRequestsError: view.pullRequestsError,
      contributionsWarning: view.contributionsWarning,
      repos: repos.map((repo) => unscore(repo, repo.nameWithOwner)),
      openPullRequests: openPullRequests.map((pr) => unscore(pr, pr.repo)),
      mergedPullRequests: mergedPullRequests.map((pr) => unscore(pr, pr.repo)),
    },
    impact: [...scores],
  };
}
