import type { DashboardData } from "@/_pages/dashboard/api/loadDashboard";
import type { PullRequest } from "@/entities/pull-request";
import type { RepoStat } from "@/entities/repo";

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

export function dashboardData(
  overrides: Partial<DashboardData> = {},
): DashboardData {
  return {
    viewer: {
      login: "octocat",
      name: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231",
    },
    totals: { contributions: 1234, restricted: 0 },
    external: { contributions: 800, ratio: 65 },
    notable: { repos: 3, contributions: 500 },
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
