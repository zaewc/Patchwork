import {
  isNotableTier,
  scoreRepo,
  tierOf,
  type ImpactTier,
  type RepoSignals,
} from "@/lib/impact";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

export class GitHubAuthError extends Error {
  constructor(message = "GitHub 토큰이 만료되었거나 유효하지 않습니다.") {
    super(message);
    this.name = "GitHubAuthError";
  }
}

export class GitHubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubError";
  }
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; type?: string }[];
};

/** GitHub는 쿼리가 제한 시간을 넘기면 JSON 대신 프록시의 502/504 HTML을 돌려준다. */
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const ATTEMPTS = 3;
const TIMEOUT_MS = 20_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
  label = "GitHub",
): Promise<T> {
  let lastError = new GitHubError(`${label} 요청에 실패했습니다.`);

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) await wait(400 * 2 ** (attempt - 1));

    let res: Response;
    try {
      res = await fetch(GITHUB_GRAPHQL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Patchwork",
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      lastError = new GitHubError(
        `${label} 요청이 ${TIMEOUT_MS / 1000}초 안에 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.`,
      );
      continue;
    }

    if (res.status === 401) throw new GitHubAuthError();

    if (RETRYABLE_STATUS.has(res.status)) {
      console.error(
        `[patchwork] ${label} 쿼리 HTTP ${res.status} (시도 ${attempt}/${ATTEMPTS})`,
        `x-github-request-id=${res.headers.get("x-github-request-id") ?? "none"}`,
      );
      lastError = new GitHubError(
        `GitHub가 쿼리를 끝내지 못했습니다 (HTTP ${res.status}). 기여한 저장소가 많으면 집계 쿼리가 제한 시간을 넘길 수 있습니다.`,
      );
      continue;
    }

    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new GitHubError(`GitHub API 오류 (HTTP ${res.status}): ${body}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) {
      if (json.errors.some((e) => e.type === "FORBIDDEN" || /bad credentials/i.test(e.message))) {
        throw new GitHubAuthError();
      }
      // TIMEOUT/서버측 일시 오류는 재시도할 가치가 있다.
      if (json.errors.some((e) => e.type === "TIMEOUT" || e.type === "SERVICE_UNAVAILABLE")) {
        lastError = new GitHubError(json.errors.map((e) => e.message).join("; "));
        continue;
      }
      throw new GitHubError(json.errors.map((e) => e.message).join("; "));
    }
    if (!json.data) throw new GitHubError("GitHub 응답이 비어 있습니다.");
    return json.data;
  }

  throw lastError;
}

/* ------------------------------------------------------------------ 조회 범위 */

export const RANGES = {
  "30d": { label: "30일", days: 30 },
  "90d": { label: "90일", days: 90 },
  "1y": { label: "1년", days: 365 },
} as const;

export type RangeKey = keyof typeof RANGES;

export function parseRange(value: unknown): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "1y";
}

/* ------------------------------------------------------------------ 타입 */

type RepoRef = {
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  isArchived: boolean;
  isInOrganization: boolean;
  createdAt: string;
  pushedAt: string | null;
  owner: { login: string };
  licenseInfo: { spdxId: string | null; key: string } | null;
};

function signalsOf(repo: RepoRef): RepoSignals {
  return {
    isPrivate: repo.isPrivate,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    isInOrganization: repo.isInOrganization,
    isFork: repo.isFork,
    isArchived: repo.isArchived,
    hasLicense: Boolean(repo.licenseInfo?.spdxId) && repo.licenseInfo?.key !== "other",
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
  };
}

type ByRepository = { repository: RepoRef; contributions: { totalCount: number } }[];

type ContributionsQuery = {
  viewer: {
    login: string;
    name: string | null;
    avatarUrl: string;
    contributionsCollection: {
      restrictedContributionsCount: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }[];
      };
      commitContributionsByRepository: ByRepository;
      pullRequestContributionsByRepository: ByRepository;
      pullRequestReviewContributionsByRepository: ByRepository;
      issueContributionsByRepository: ByRepository;
    };
  };
};

export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
export type CheckState = "SUCCESS" | "FAILURE" | "ERROR" | "PENDING" | "EXPECTED" | null;

type PullRequestNode = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  mergedAt: string | null;
  reviewDecision: ReviewDecision;
  repository: RepoRef;
  commits: { nodes: { commit: { statusCheckRollup: { state: CheckState } | null } }[] };
};

type PullRequestsQuery = {
  open: { issueCount: number; nodes: (PullRequestNode | Record<string, never>)[] };
  merged: { issueCount: number; nodes: (PullRequestNode | Record<string, never>)[] };
};

export type PullRequest = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  mergedAt: string | null;
  reviewDecision: ReviewDecision;
  checkState: CheckState;
  repo: string;
  repoUrl: string;
  isPrivate: boolean;
  isExternal: boolean;
  impact: number;
  tier: ImpactTier;
  /** 최근 업데이트가 없는 채로 열려 있는 PR */
  isStale: boolean;
};

export type RepoStat = {
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  isExternal: boolean;
  /** 0~100 권위 추정 점수 (lib/impact.ts) */
  impact: number;
  tier: ImpactTier;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  total: number;
};

export type CalendarDay = { date: string; count: number; weekday: number };

export type DashboardData = {
  viewer: { login: string; name: string | null; avatarUrl: string };
  range: RangeKey;
  totals: { contributions: number; restricted: number };
  external: {
    repos: number;
    contributions: number;
    ratio: number;
  };
  /** 주요 OSS 이상 등급이면서 내 소유가 아닌 저장소에 대한 기여 */
  notable: {
    repos: number;
    contributions: number;
    ratio: number;
    topRepo: string | null;
  };
  weeks: CalendarDay[][];
  repos: RepoStat[];
  openPullRequests: PullRequest[];
  mergedPullRequests: PullRequest[];
  openCount: number;
  mergedCount: number;
  /** PR 조회만 실패한 경우의 사유. 나머지 지표는 정상이다. */
  pullRequestsError: string | null;
};

/* ------------------------------------------------------------------ 쿼리 */

/**
 * 권위 추정에 쓰는 저장소 신호. 두 쿼리가 같은 조각을 공유한다.
 * 전부 스칼라(또는 단건 조회) 필드로만 구성한다 — 여기에 커넥션 totalCount를 넣으면
 * 저장소 수십 개를 순회할 때 GraphQL 쿼리가 통째로 타임아웃(502)난다.
 */
const REPO_CORE_FRAGMENT = `
fragment RepoCore on Repository {
  nameWithOwner
  url
  isPrivate
  stargazerCount
  forkCount
  isFork
  isArchived
  isInOrganization
  createdAt
  pushedAt
  owner { login }
  licenseInfo { spdxId key }
}`;

const REPO_FIELDS = `
  repository { ...RepoCore }
  contributions { totalCount }
`;

const CONTRIBUTIONS_QUERY = `
${REPO_CORE_FRAGMENT}

query Contributions($from: DateTime!, $to: DateTime!) {
  viewer {
    login
    name
    avatarUrl
    contributionsCollection(from: $from, to: $to) {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
      commitContributionsByRepository(maxRepositories: 25) { ${REPO_FIELDS} }
      pullRequestContributionsByRepository(maxRepositories: 25) { ${REPO_FIELDS} }
      pullRequestReviewContributionsByRepository(maxRepositories: 25) { ${REPO_FIELDS} }
      issueContributionsByRepository(maxRepositories: 25) { ${REPO_FIELDS} }
    }
  }
}`;

const PULL_REQUESTS_QUERY = `
${REPO_CORE_FRAGMENT}

fragment PR on PullRequest {
  number
  title
  url
  isDraft
  updatedAt
  mergedAt
  reviewDecision
  repository { ...RepoCore }
  commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
}

query PullRequests($openQuery: String!, $mergedQuery: String!) {
  open: search(query: $openQuery, type: ISSUE, first: 30) {
    issueCount
    nodes { ...PR }
  }
  merged: search(query: $mergedQuery, type: ISSUE, first: 15) {
    issueCount
    nodes { ...PR }
  }
}`;

/* ------------------------------------------------------------------ 가공 */

const STALE_DAYS = 14;

function toPullRequest(node: PullRequestNode, viewerLogin: string, now: number): PullRequest {
  const updatedDaysAgo = (now - new Date(node.updatedAt).getTime()) / 86_400_000;
  const impact = scoreRepo(signalsOf(node.repository), now);
  return {
    number: node.number,
    title: node.title,
    url: node.url,
    isDraft: node.isDraft,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt,
    reviewDecision: node.reviewDecision,
    checkState: node.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null,
    repo: node.repository.nameWithOwner,
    repoUrl: node.repository.url,
    isPrivate: node.repository.isPrivate,
    isExternal: node.repository.owner.login.toLowerCase() !== viewerLogin.toLowerCase(),
    impact,
    tier: tierOf(impact),
    isStale: !node.mergedAt && updatedDaysAgo >= STALE_DAYS,
  };
}

function isPullRequestNode(node: PullRequestNode | Record<string, never>): node is PullRequestNode {
  return typeof (node as PullRequestNode).number === "number";
}

export function aggregateRepos(
  collection: ContributionsQuery["viewer"]["contributionsCollection"],
  viewerLogin: string,
): RepoStat[] {
  const map = new Map<string, RepoStat>();

  const merge = (entries: ByRepository, field: "commits" | "pullRequests" | "reviews" | "issues") => {
    for (const entry of entries) {
      const repo = entry.repository;
      const impact = scoreRepo(signalsOf(repo));
      const existing = map.get(repo.nameWithOwner) ?? {
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        isPrivate: repo.isPrivate,
        isExternal: repo.owner.login.toLowerCase() !== viewerLogin.toLowerCase(),
        impact,
        tier: tierOf(impact),
        commits: 0,
        pullRequests: 0,
        reviews: 0,
        issues: 0,
        total: 0,
      };
      existing[field] += entry.contributions.totalCount;
      existing.total += entry.contributions.totalCount;
      map.set(repo.nameWithOwner, existing);
    }
  };

  merge(collection.commitContributionsByRepository, "commits");
  merge(collection.pullRequestContributionsByRepository, "pullRequests");
  merge(collection.pullRequestReviewContributionsByRepository, "reviews");
  merge(collection.issueContributionsByRepository, "issues");

  return [...map.values()].sort(
    (a, b) => b.total - a.total || a.nameWithOwner.localeCompare(b.nameWithOwner),
  );
}

/* ------------------------------------------------------------------ 진입점 */

export async function fetchDashboard(token: string, range: RangeKey): Promise<DashboardData> {
  const now = Date.now();
  const to = new Date(now);
  const from = new Date(now - RANGES[range].days * 86_400_000);
  const mergedSince = new Date(now - RANGES[range].days * 86_400_000).toISOString().slice(0, 10);

  const [contributionsResult, pullRequestsResult] = await Promise.allSettled([
    graphql<ContributionsQuery>(
      token,
      CONTRIBUTIONS_QUERY,
      { from: from.toISOString(), to: to.toISOString() },
      "기여 집계",
    ),
    graphql<PullRequestsQuery>(
      token,
      PULL_REQUESTS_QUERY,
      {
        openQuery: "is:pr author:@me is:open archived:false sort:updated-desc",
        mergedQuery: `is:pr author:@me is:merged merged:>=${mergedSince} sort:updated-desc`,
      },
      "PR 조회",
    ),
  ]);

  // 기여 집계는 대시보드의 뼈대라 실패하면 렌더할 것이 없다.
  if (contributionsResult.status === "rejected") throw contributionsResult.reason;
  const contributions = contributionsResult.value;

  // PR 조회만 실패했다면 나머지는 그대로 보여주고 그 구역만 비운다.
  if (pullRequestsResult.status === "rejected" && pullRequestsResult.reason instanceof GitHubAuthError) {
    throw pullRequestsResult.reason;
  }
  const pullRequests: PullRequestsQuery =
    pullRequestsResult.status === "fulfilled"
      ? pullRequestsResult.value
      : { open: { issueCount: 0, nodes: [] }, merged: { issueCount: 0, nodes: [] } };
  const pullRequestsError =
    pullRequestsResult.status === "rejected"
      ? pullRequestsResult.reason instanceof Error
        ? pullRequestsResult.reason.message
        : "PR을 불러오지 못했습니다."
      : null;

  const viewer = contributions.viewer;
  const collection = viewer.contributionsCollection;
  const login = viewer.login;

  const weeks: CalendarDay[][] = collection.contributionCalendar.weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      weekday: day.weekday,
    })),
  );

  const repos = aggregateRepos(collection, login);
  const externalRepos = repos.filter((r) => r.isExternal);
  const externalContributions = externalRepos.reduce((sum, r) => sum + r.total, 0);
  const allContributions = repos.reduce((sum, r) => sum + r.total, 0);
  const notableRepos = externalRepos.filter((r) => isNotableTier(r.tier));
  const notableContributions = notableRepos.reduce((sum, r) => sum + r.total, 0);

  const toPR = (nodes: (PullRequestNode | Record<string, never>)[]) =>
    nodes.filter(isPullRequestNode).map((n) => toPullRequest(n, login, now));

  return {
    viewer: { login, name: viewer.name, avatarUrl: viewer.avatarUrl },
    range,
    totals: {
      contributions: collection.contributionCalendar.totalContributions,
      restricted: collection.restrictedContributionsCount,
    },
    external: {
      repos: externalRepos.length,
      contributions: externalContributions,
      ratio: allContributions > 0 ? Math.round((externalContributions / allContributions) * 100) : 0,
    },
    notable: {
      repos: notableRepos.length,
      contributions: notableContributions,
      ratio: allContributions > 0 ? Math.round((notableContributions / allContributions) * 100) : 0,
      topRepo:
        [...notableRepos].sort((a, b) => b.impact - a.impact)[0]?.nameWithOwner ?? null,
    },
    weeks,
    repos,
    openPullRequests: toPR(pullRequests.open.nodes),
    mergedPullRequests: toPR(pullRequests.merged.nodes),
    openCount: pullRequests.open.issueCount,
    mergedCount: pullRequests.merged.issueCount,
    pullRequestsError,
  };
}

export async function fetchViewerIdentity(token: string) {
  const data = await graphql<{
    viewer: { login: string; name: string | null; avatarUrl: string };
  }>(token, `query { viewer { login name avatarUrl } }`);
  return data.viewer;
}
