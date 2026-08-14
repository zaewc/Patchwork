/** GitHub GraphQL 응답 조각을 만드는 빌더. 실제 타입과 구조적으로 호환된다. */

export type RepoRefFixture = {
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  owner: { login: string; avatarUrl: string };
};

/** 널리 쓰이는 Repository. 점수는 deps.dev의 Scorecard에서 따로 온다. */
export function repoRef(
  nameWithOwner: string,
  overrides: Partial<RepoRefFixture> = {},
): RepoRefFixture {
  const [login, name] = nameWithOwner.split("/");
  return {
    name,
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    isPrivate: false,
    stargazerCount: 50_000,
    forkCount: 10_000,
    owner: { login, avatarUrl: `https://avatars.githubusercontent.com/${login}` },
    ...overrides,
  };
}

/** 거의 아무도 안 보는 Repository. Scorecard가 없으면 audience 점수도 낮다. */
export function toyRepoRef(
  nameWithOwner: string,
  overrides: Partial<RepoRefFixture> = {},
): RepoRefFixture {
  return repoRef(nameWithOwner, { stargazerCount: 2, forkCount: 0, ...overrides });
}

export type ContributionEntry = {
  repository: RepoRefFixture;
  contributions: { totalCount: number };
};

export const entry = (repository: RepoRefFixture, totalCount: number): ContributionEntry => ({
  repository,
  contributions: { totalCount },
});

export type CalendarDayFixture = { date: string; contributionCount: number; weekday: number };

/** 시작 날짜부터 count일치 달력을 만든다. 주 단위(일요일 시작)로 끊는다. */
export function calendarWeeks(
  startDate: string,
  counts: number[],
): { contributionDays: CalendarDayFixture[] }[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const weeks: { contributionDays: CalendarDayFixture[] }[] = [];

  counts.forEach((contributionCount, offset) => {
    const date = new Date(start.getTime() + offset * 86_400_000);
    const weekday = date.getUTCDay();
    if (weeks.length === 0 || weekday === 0) weeks.push({ contributionDays: [] });
    weeks[weeks.length - 1].contributionDays.push({
      date: date.toISOString().slice(0, 10),
      contributionCount,
      weekday,
    });
  });

  return weeks;
}

export type CollectionFixture = {
  restrictedContributionsCount: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: CalendarDayFixture[] }[];
  };
  commitContributionsByRepository: ContributionEntry[];
  pullRequestContributionsByRepository: ContributionEntry[];
  pullRequestReviewContributionsByRepository: ContributionEntry[];
  issueContributionsByRepository: ContributionEntry[];
};

export function collection(overrides: Partial<CollectionFixture> = {}): CollectionFixture {
  return {
    restrictedContributionsCount: 0,
    contributionCalendar: { totalContributions: 0, weeks: [] },
    commitContributionsByRepository: [],
    pullRequestContributionsByRepository: [],
    pullRequestReviewContributionsByRepository: [],
    issueContributionsByRepository: [],
    ...overrides,
  };
}

export const VIEWER = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

export const contributionsResponse = (overrides: Partial<CollectionFixture> = {}) => ({
  viewer: { ...VIEWER, contributionsCollection: collection(overrides) },
});

export type PullRequestNodeFixture = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  mergedAt: string | null;
  reviewDecision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  repository: RepoRefFixture;
  commits: { nodes: { commit: { statusCheckRollup: { state: string } | null } }[] };
};

export function pullRequestNode(
  overrides: Partial<PullRequestNodeFixture> = {},
): PullRequestNodeFixture {
  const number = overrides.number ?? 1;
  const repository = overrides.repository ?? repoRef("vercel/next.js");
  return {
    number,
    title: `제목 ${number}`,
    url: `${repository.url}/pull/${number}`,
    isDraft: false,
    updatedAt: "2026-08-14T00:00:00Z",
    mergedAt: null,
    reviewDecision: "REVIEW_REQUIRED",
    repository,
    commits: { nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS" } } }] },
    ...overrides,
  };
}

export const pullRequestsResponse = (
  open: PullRequestNodeFixture[] = [],
  merged: PullRequestNodeFixture[] = [],
  counts: { open?: number; merged?: number } = {},
) => ({
  open: { issueCount: counts.open ?? open.length, nodes: open },
  merged: { issueCount: counts.merged ?? merged.length, nodes: merged },
});

export type ItemNodeFixture = {
  __typename: "PullRequest" | "Issue";
  title: string;
  url: string;
  createdAt: string;
  mergedAt?: string | null;
  stateReason?: "COMPLETED" | "NOT_PLANNED" | null;
  repository: RepoRefFixture;
};

export function mergedPullRequestItem(
  overrides: Partial<ItemNodeFixture> = {},
): ItemNodeFixture {
  const repository = overrides.repository ?? repoRef("vercel/next.js");
  return {
    __typename: "PullRequest",
    title: "PR 제목",
    url: `${repository.url}/pull/1`,
    createdAt: "2026-03-04T00:00:00Z",
    mergedAt: "2026-03-05T00:00:00Z",
    repository,
    ...overrides,
  };
}

export function completedIssueItem(overrides: Partial<ItemNodeFixture> = {}): ItemNodeFixture {
  const repository = overrides.repository ?? repoRef("vercel/next.js");
  return {
    __typename: "Issue",
    title: "Issue 제목",
    url: `${repository.url}/issues/2`,
    createdAt: "2026-03-06T00:00:00Z",
    stateReason: "COMPLETED",
    repository,
    ...overrides,
  };
}

export const searchItemsResponse = (
  nodes: (ItemNodeFixture | Record<string, never>)[],
  pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
    hasNextPage: false,
    endCursor: null,
  },
) => ({ search: { pageInfo, nodes } });
