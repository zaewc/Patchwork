/** E2E가 기대하는 GitHub 응답 데이터. 날짜는 실행 시각을 기준으로 만든다. */

const DAY = 86_400_000;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();
const date = (daysAgo) => iso(daysAgo).slice(0, 10);
const avatarUrl = (login) =>
  process.env.MOCK_AVATAR_URL ?? `https://avatars.githubusercontent.com/${login}`;

export const VIEWER = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: avatarUrl("u/583231"),
};

const repo = (nameWithOwner, overrides = {}) => {
  const [login, name] = nameWithOwner.split("/");
  return {
    name,
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    isPrivate: false,
    stargazerCount: 100_000,
    forkCount: 20_000,
    owner: { login, avatarUrl: avatarUrl(login) },
    ...overrides,
  };
};

/** 널리 쓰이고 잘 관리되는 프로젝트 */
export const NEXT_JS = repo("vercel/next.js");

/** 내 소유. 작고 Scorecard도 낮다. */
export const MINE = repo("octocat/patchwork", {
  stargazerCount: 4,
  forkCount: 0,
  owner: { login: "octocat", avatarUrl: VIEWER.avatarUrl },
});

/** 남의 것이지만 작고, deps.dev가 아직 모른다. */
export const TOY = repo("someone/toy-lib", { stargazerCount: 6, forkCount: 1 });

/** 비공개 Repository. deps.dev에 물어볼 것도 없다. */
export const PRIVATE = repo("acme/internal", { isPrivate: true });

/**
 * deps.dev가 아는 OpenSSF Scorecard 총점(0~10).
 * 여기 없는 repository는 mock 서버가 404로 답한다.
 */
export const SCORECARDS = {
  "vercel/next.js": 8.0,
  "octocat/patchwork": 2.5,
};

const entry = (repository, totalCount) => ({ repository, contributions: { totalCount } });

/** 90일치 달력. 합계 300건이 되도록 고정된 패턴을 쓴다. */
function calendar() {
  const counts = Array.from({ length: 90 }, (_, i) => [0, 1, 2, 5, 9, 0, 3][i % 7]);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const weeks = [];

  counts.forEach((contributionCount, i) => {
    const daysAgo = counts.length - 1 - i;
    const day = new Date(Date.now() - daysAgo * DAY);
    const weekday = day.getUTCDay();
    if (weeks.length === 0 || weekday === 0) weeks.push({ contributionDays: [] });
    weeks[weeks.length - 1].contributionDays.push({
      date: day.toISOString().slice(0, 10),
      contributionCount,
      weekday,
    });
  });

  return { totalContributions: total, weeks };
}

export const CALENDAR_TOTAL = calendar().totalContributions;

export const contributionsCollection = () => ({
  restrictedContributionsCount: 12,
  contributionCalendar: calendar(),
  commitContributionsByRepository: [
    entry(NEXT_JS, 40),
    entry(MINE, 12),
    entry(TOY, 3),
    entry(PRIVATE, 5),
  ],
  pullRequestContributionsByRepository: [entry(NEXT_JS, 5), entry(TOY, 1)],
  pullRequestReviewContributionsByRepository: [entry(NEXT_JS, 2)],
  issueContributionsByRepository: [entry(NEXT_JS, 1)],
});

export const emptyCollection = () => ({
  restrictedContributionsCount: 0,
  contributionCalendar: { totalContributions: 0, weeks: [] },
  commitContributionsByRepository: [],
  pullRequestContributionsByRepository: [],
  pullRequestReviewContributionsByRepository: [],
  issueContributionsByRepository: [],
});

const pullRequest = (number, repository, overrides = {}) => ({
  number,
  title: `제목 ${number}`,
  url: `${repository.url}/pull/${number}`,
  isDraft: false,
  updatedAt: iso(2),
  mergedAt: null,
  reviewDecision: "REVIEW_REQUIRED",
  repository,
  commits: { nodes: [{ commit: { statusCheckRollup: { state: "SUCCESS" } } }] },
  ...overrides,
});

export const OPEN_PULL_REQUESTS = [
  pullRequest(101, NEXT_JS, { title: "fix: hydration mismatch" }),
  pullRequest(102, NEXT_JS, {
    title: "feat: turbopack 플래그 추가",
    reviewDecision: "APPROVED",
    updatedAt: iso(30),
    commits: { nodes: [{ commit: { statusCheckRollup: { state: "FAILURE" } } }] },
  }),
  pullRequest(103, NEXT_JS, { title: "chore: 초안", isDraft: true }),
  pullRequest(104, NEXT_JS, {
    title: "refactor: 변경 요청 받은 PR",
    reviewDecision: "CHANGES_REQUESTED",
  }),
  pullRequest(7, TOY, { title: "docs: 오타 수정" }),
];

export const MERGED_PULL_REQUESTS = [
  pullRequest(99, NEXT_JS, { title: "perf: 번들 크기 줄이기", mergedAt: iso(3), updatedAt: iso(3) }),
  pullRequest(5, TOY, { title: "test: 커버리지 보강", mergedAt: iso(5), updatedAt: iso(5) }),
];

export const MERGED_ITEMS = [
  {
    __typename: "PullRequest",
    title: "perf: 번들 크기 줄이기",
    url: `${NEXT_JS.url}/pull/99`,
    createdAt: iso(10),
    mergedAt: iso(3),
    repository: NEXT_JS,
  },
  {
    __typename: "PullRequest",
    title: "fix: [docs] 링크 교정",
    url: `${NEXT_JS.url}/pull/98`,
    createdAt: iso(20),
    mergedAt: iso(18),
    repository: NEXT_JS,
  },
  {
    __typename: "PullRequest",
    title: "test: 커버리지 보강",
    url: `${TOY.url}/pull/5`,
    createdAt: iso(6),
    mergedAt: iso(5),
    repository: TOY,
  },
  // merge되지 않은 PR — 목록에서 빠져야 한다.
  {
    __typename: "PullRequest",
    title: "wip: 아직 열려 있음",
    url: `${NEXT_JS.url}/pull/105`,
    createdAt: iso(4),
    mergedAt: null,
    repository: NEXT_JS,
  },
];

export const COMPLETED_ITEMS = [
  {
    __typename: "Issue",
    title: "docs: 설치 안내가 낡았습니다",
    url: `${NEXT_JS.url}/issues/500`,
    createdAt: iso(15),
    stateReason: "COMPLETED",
    repository: NEXT_JS,
  },
  // 완료가 아닌 issue — 목록에서 빠져야 한다.
  {
    __typename: "Issue",
    title: "질문: 이건 계획에 없습니다",
    url: `${NEXT_JS.url}/issues/501`,
    createdAt: iso(14),
    stateReason: "NOT_PLANNED",
    repository: NEXT_JS,
  },
];

export const EXPECTED = {
  /** 화면에서 확인할 값들 */
  calendarTotal: CALENDAR_TOTAL,
  restricted: 12,
  firstCalendarDate: date(89),
  /** 주요 OSS 모드에서 보이는 열린 PR 수 (someone/toy-lib #7 제외) */
  notableOpenCount: 4,
  openIssueCount: OPEN_PULL_REQUESTS.length,
};
