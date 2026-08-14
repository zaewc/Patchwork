import { daysSince, percent } from "@/lib/format";
import { isNotable, scoreRepo, type RepoSignals } from "@/lib/impact";

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
        `GitHub가 쿼리를 끝내지 못했습니다 (HTTP ${res.status}). 기여한 Repository가 많으면 집계 쿼리가 제한 시간을 넘길 수 있습니다.`,
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
  "5y": { label: "5년", days: 365 * 5 },
} as const;

const MAX_WINDOW_DAYS = 365;
const DAY_MS = 86_400_000;

export function windowsFor(range: RangeKey, now: number): { from: Date; to: Date }[] {
  const windows: { from: Date; to: Date }[] = [];
  let end = now;
  let remaining = RANGES[range].days;

  while (remaining > 0) {
    const span = Math.min(remaining, MAX_WINDOW_DAYS);
    const start = end - span * DAY_MS;
    windows.push({ from: new Date(start), to: new Date(end) });
    end = start - 1;
    remaining -= span;
  }

  return windows.reverse();
}

export type RangeKey = keyof typeof RANGES;

export function parseRange(value: unknown): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "1y";
}

/* ------------------------------------------------------------------ 타입 */

type RepoRef = {
  name: string;
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
  owner: { login: string; avatarUrl: string };
  licenseInfo: { key: string } | null;
};

function signalsOf(repo: RepoRef): RepoSignals {
  return {
    isPrivate: repo.isPrivate,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    isInOrganization: repo.isInOrganization,
    isFork: repo.isFork,
    isArchived: repo.isArchived,
    // GitHub이 분류하지 못한 커스텀 라이선스(key: other)도 '선언은 했다'로 본다.
    hasLicense: repo.licenseInfo !== null,
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
  ownerAvatarUrl: string;
  isPrivate: boolean;
  impact: number;
  /** 최근 업데이트가 없는 채로 열려 있는 PR */
  isStale: boolean;
};

export type RepoStat = {
  nameWithOwner: string;
  url: string;
  /** owner(사용자·조직)의 avatar. 사실상 프로젝트 로고 역할을 한다. */
  ownerAvatarUrl: string;
  isPrivate: boolean;
  isExternal: boolean;
  /** 0~100 권위 추정 점수 (lib/impact.ts) */
  impact: number;
  commits: number | null;
  pullRequests: number | null;
  reviews: number | null;
  issues: number | null;
  total: number;
};

export type CalendarDay = { date: string; count: number; weekday: number };

export type DashboardData = {
  viewer: { login: string; name: string | null; avatarUrl: string };
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

/* ------------------------------------------------------------------ 쿼리 */

/**
 * 권위 추정에 쓰는 Repository 신호. 두 쿼리가 같은 조각을 공유한다.
 * 전부 스칼라(또는 단건 조회) 필드로만 구성한다 — 여기에 커넥션 totalCount를 넣으면
 * Repository 수십 개를 순회할 때 GraphQL 쿼리가 통째로 타임아웃(502)난다.
 */
const REPO_CORE_FRAGMENT = `
fragment RepoCore on Repository {
  name
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
  owner { login avatarUrl(size: 64) }
  licenseInfo { key }
}`;

/**
 * contributionsCollection의 *ByRepository는 기여 수 상위 N곳만 돌려준다(GitHub 최대 100).
 * 이 상한에 걸려 잘리면 "커밋이 적은 repository"의 커밋 수가 통째로 빠져 0으로 집계된다.
 */
const MAX_REPOSITORIES = 100;

/**
 * PR·review·issue는 커밋만큼 저장소가 많지 않다. 100으로 두면 창 5개 × 4항목에서
 * 같은 repository 정보가 최대 20번 반복돼 응답이 수백 KiB로 불어나고 502 위험이 커진다.
 */
const MAX_REPOSITORIES_SECONDARY = 50;

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
      commitContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES}) { ${REPO_FIELDS} }
      pullRequestContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
      pullRequestReviewContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
      issueContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
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

function toPullRequest(node: PullRequestNode, now: number): PullRequest {
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
    ownerAvatarUrl: node.repository.owner.avatarUrl,
    isPrivate: node.repository.isPrivate,
    impact,
    isStale: !node.mergedAt && daysSince(node.updatedAt, now) >= STALE_DAYS,
  };
}

function isPullRequestNode(node: PullRequestNode | Record<string, never>): node is PullRequestNode {
  return typeof (node as PullRequestNode).number === "number";
}

type Collection = ContributionsQuery["viewer"]["contributionsCollection"];

export function aggregateRepos(
  collections: Collection[],
  viewerLogin: string,
  now: number = Date.now(),
): RepoStat[] {
  const map = new Map<string, RepoStat>();
  type Field = "commits" | "pullRequests" | "reviews" | "issues";

  /**
   * 상한에 걸려 잘린 (조회 창, 항목) 하나하나가 "구멍"이다. 그 목록에 없던 repository는
   * 해당 항목의 수를 알 수 없다. 창 단위로 기록해야 5년처럼 창이 여러 개일 때
   * "창 하나에서만 잘린" 경우를 놓치지 않는다.
   */
  const gaps: { field: Field; listed: Set<string> }[] = [];

  const merge = (entries: ByRepository, field: Field) => {
    const cap = field === "commits" ? MAX_REPOSITORIES : MAX_REPOSITORIES_SECONDARY;
    if (entries.length >= cap) {
      gaps.push({ field, listed: new Set(entries.map((e) => e.repository.nameWithOwner)) });
    }

    for (const entry of entries) {
      const repo = entry.repository;
      let existing = map.get(repo.nameWithOwner);
      if (!existing) {
        existing = {
          nameWithOwner: repo.nameWithOwner,
          url: repo.url,
          ownerAvatarUrl: repo.owner.avatarUrl,
          isPrivate: repo.isPrivate,
          isExternal: repo.owner.login.toLowerCase() !== viewerLogin.toLowerCase(),
          impact: scoreRepo(signalsOf(repo), now),
          commits: 0,
          pullRequests: 0,
          reviews: 0,
          issues: 0,
          total: 0,
        };
        map.set(repo.nameWithOwner, existing);
      }
      existing[field] = (existing[field] ?? 0) + entry.contributions.totalCount;
      existing.total += entry.contributions.totalCount;
    }
  };

  for (const collection of collections) {
    merge(collection.commitContributionsByRepository, "commits");
    merge(collection.pullRequestContributionsByRepository, "pullRequests");
    merge(collection.pullRequestReviewContributionsByRepository, "reviews");
    merge(collection.issueContributionsByRepository, "issues");
  }

  for (const repo of map.values()) {
    for (const gap of gaps) {
      if (!gap.listed.has(repo.nameWithOwner)) repo[gap.field] = null;
    }
  }

  return [...map.values()].sort(
    (a, b) => b.total - a.total || a.nameWithOwner.localeCompare(b.nameWithOwner),
  );
}

/**
 * 여러 조회 창의 달력을 하나로 잇는다. 창 경계의 주는 양쪽에 걸쳐 들어오므로
 * 날짜로 중복을 제거한 뒤 일요일 기준으로 다시 주 단위로 묶는다.
 */
export function mergeCalendars(collections: Collection[]): CalendarDay[][] {
  const byDate = new Map<string, CalendarDay>();
  for (const collection of collections) {
    for (const week of collection.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        byDate.set(day.date, {
          date: day.date,
          count: day.contributionCount,
          weekday: day.weekday,
        });
      }
    }
  }

  const days = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks: CalendarDay[][] = [];
  for (const day of days) {
    if (weeks.length === 0 || day.weekday === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
  }
  return weeks;
}

/* ------------------------------------------------------------------ README 내보내기 */

export type ContributionItem = {
  type: "PR" | "Issue";
  title: string;
  url: string;
  createdAt: string;
};

export type ContributionGroup = {
  name: string;
  nameWithOwner: string;
  url: string;
  impact: number;
  items: ContributionItem[];
};

type ItemNode = {
  __typename: "PullRequest" | "Issue" | string;
  title: string;
  url: string;
  createdAt: string;
  mergedAt?: string | null;
  stateReason?: "COMPLETED" | "NOT_PLANNED" | "REOPENED" | "DUPLICATE" | null;
  repository: RepoRef;
};

type ItemsQuery = {
  search: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: (ItemNode | Record<string, never>)[];
  };
};

const ITEMS_QUERY = `
${REPO_CORE_FRAGMENT}

fragment Item on Node {
  ... on PullRequest { title url createdAt mergedAt repository { ...RepoCore } }
  ... on Issue { title url createdAt stateReason repository { ...RepoCore } }
}

query Items($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { __typename ...Item }
  }
}`;

/** search는 페이지당 100건, 전체 1000건이 상한이다. */
const MAX_ITEM_PAGES = 5;

function isItemNode(node: ItemNode | Record<string, never>): node is ItemNode {
  return "repository" in node && Boolean(node.repository);
}

async function searchItems(token: string, query: string): Promise<ItemNode[]> {
  const nodes: ItemNode[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_ITEM_PAGES; page++) {
    const data: ItemsQuery = await graphql<ItemsQuery>(
      token,
      ITEMS_QUERY,
      { q: query, after },
      "기여 목록",
    );
    nodes.push(...data.search.nodes.filter(isItemNode));

    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  }

  return nodes;
}

/**
 * 기간 안의 "결론이 난" 기여만 repository별로 묶는다.
 *  - PR: merge된 것만. 열려 있거나 반려된 것은 제외.
 *  - Issue: 메인테이너가 완료로 닫은 것만. not planned로 닫힌 제보는 제외.
 * 공개 저장소만 담는다 — README에 붙일 링크라 비공개는 의미가 없다.
 */
export async function fetchContributionItems(
  token: string,
  range: RangeKey,
  now: number = Date.now(),
): Promise<ContributionGroup[]> {
  const since = windowsFor(range, now)[0].from.toISOString().slice(0, 10);
  const scope = `author:@me is:public created:>=${since} sort:created-asc`;

  const [pullRequests, issues] = await Promise.all([
    searchItems(token, `${scope} is:pr is:merged`),
    searchItems(token, `${scope} is:issue is:closed reason:completed`),
  ]);

  const groups = new Map<string, ContributionGroup>();

  for (const node of [...pullRequests, ...issues]) {
    const isPullRequest = node.__typename === "PullRequest";
    // 검색 한정자를 GitHub이 무시하는 경우까지 대비해 응답 값으로 한 번 더 거른다.
    if (isPullRequest ? !node.mergedAt : node.stateReason !== "COMPLETED") continue;

    const repo = node.repository;
    let group = groups.get(repo.nameWithOwner);
    if (!group) {
      group = {
        name: repo.name,
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        impact: scoreRepo(signalsOf(repo), now),
        items: [],
      };
      groups.set(repo.nameWithOwner, group);
    }
    group.items.push({
      type: isPullRequest ? "PR" : "Issue",
      title: node.title,
      url: node.url,
      createdAt: node.createdAt,
    });
  }

  // 기여가 많은 repository부터. 목록 안은 시간순.
  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ 진입점 */

export async function fetchDashboard(token: string, range: RangeKey): Promise<DashboardData> {
  const now = Date.now();
  const windows = windowsFor(range, now);
  const mergedSince = windows[0].from.toISOString().slice(0, 10);

  const [contributionResults, [pullRequestsResult]] = await Promise.all([
    Promise.allSettled(
      windows.map((window, index) =>
        graphql<ContributionsQuery>(
          token,
          CONTRIBUTIONS_QUERY,
          { from: window.from.toISOString(), to: window.to.toISOString() },
          windows.length > 1 ? `기여 집계 ${index + 1}/${windows.length}` : "기여 집계",
        ),
      ),
    ),
    Promise.allSettled([
      graphql<PullRequestsQuery>(
        token,
        PULL_REQUESTS_QUERY,
        {
          openQuery: "is:pr author:@me is:open archived:false sort:updated-desc",
          mergedQuery: `is:pr author:@me is:merged merged:>=${mergedSince} sort:updated-desc`,
        },
        "PR 조회",
      ),
    ]),
  ]);

  const rejected = contributionResults.filter((r) => r.status === "rejected");
  const authError = rejected.find((r) => r.reason instanceof GitHubAuthError);
  if (authError) throw authError.reason;

  const fulfilled = contributionResults.filter((r) => r.status === "fulfilled");
  // 기여 집계는 대시보드의 뼈대라 전부 실패하면 렌더할 것이 없다.
  if (fulfilled.length === 0) throw rejected[0].reason;

  // 여러 해를 나눠 부르는 경우, 일부 구간만 실패하면 나머지로 그린다.
  const contributionsWarning =
    rejected.length > 0
      ? `${windows.length}개 구간 중 ${rejected.length}개를 불러오지 못해 일부 기간이 빠져 있습니다.`
      : null;

  const contributions = fulfilled[0].value;
  const collections = fulfilled.map((r) => r.value.viewer.contributionsCollection);

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
  const login = viewer.login;

  const weeks = mergeCalendars(collections);
  const repos = aggregateRepos(collections, login, now);
  const externalRepos = repos.filter((r) => r.isExternal);
  const externalContributions = externalRepos.reduce((sum, r) => sum + r.total, 0);
  const allContributions = repos.reduce((sum, r) => sum + r.total, 0);
  const notableRepos = externalRepos.filter((r) => isNotable(r.impact));
  const notableContributions = notableRepos.reduce((sum, r) => sum + r.total, 0);

  const toPR = (nodes: (PullRequestNode | Record<string, never>)[]) =>
    nodes.filter(isPullRequestNode).map((n) => toPullRequest(n, now));

  return {
    viewer: { login, name: viewer.name, avatarUrl: viewer.avatarUrl },
    totals: {
      // 창 경계의 중복을 이미 걷어낸 달력에서 세는 편이 합계를 두 번 더하지 않는다.
      contributions: weeks.flat().reduce((sum, day) => sum + day.count, 0),
      restricted: collections.reduce((sum, c) => sum + c.restrictedContributionsCount, 0),
    },
    external: {
      contributions: externalContributions,
      ratio: percent(externalContributions, allContributions),
    },
    notable: { repos: notableRepos.length, contributions: notableContributions },
    weeks,
    repos,
    openPullRequests: toPR(pullRequests.open.nodes),
    mergedPullRequests: toPR(pullRequests.merged.nodes),
    openCount: pullRequests.open.issueCount,
    pullRequestsError,
    contributionsWarning,
  };
}

export async function fetchViewerIdentity(token: string) {
  const data = await graphql<{
    viewer: { login: string; name: string | null; avatarUrl: string };
  }>(token, `query { viewer { login name avatarUrl } }`);
  return data.viewer;
}
