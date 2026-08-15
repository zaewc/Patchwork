import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDashboard } from "@/_pages/dashboard/api/loadDashboard";
import { GitHubAuthError } from "@/shared/api";
import {
  calendarWeeks,
  contributionsResponse,
  entry,
  pullRequestNode,
  pullRequestsResponse,
  repoRef,
  toyRepoRef,
  VIEWER,
  type PullRequestNodeFixture,
} from "@/shared/api/github/response.fixtures";
import { dictionaryOf } from "@/shared/lib/i18n-server";

const KO = dictionaryOf("ko");

const NOW = Date.parse("2026-08-15T00:00:00Z");

type Operation = "contributions" | "pullRequests";
type Handler = (
  variables: Record<string, unknown>,
  callIndex: number,
) => Response;

const fetchMock = vi.fn<typeof fetch>();
const requests: { query: string; variables: Record<string, unknown> }[] = [];

const operationOf = (query: string): Operation =>
  query.includes("query Contributions") ? "contributions" : "pullRequests";

const ok = (data: unknown) => new Response(JSON.stringify({ data }));
const graphQLErrors = (messages: string[]) =>
  new Response(
    JSON.stringify({ errors: messages.map((message) => ({ message })) }),
  );
const httpError = (status: number) => new Response("", { status });

const requestUrl = (input: string | URL | Request): string => {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
};

const bodyText = (body: BodyInit | null | undefined): string => {
  if (typeof body !== "string")
    throw new TypeError("GraphQL 요청 본문이 문자열이 아닙니다.");
  return body;
};

/** repository 이름 → Scorecard 총점. 여기 없는 repository는 deps.dev가 모르는 것으로 본다. */
let scorecards: Record<string, number> = {};

/** deps.dev 조회를 흉내낸다. 요청 URL에서 repository 이름을 되돌린다. */
function replyFromDepsDev(url: string): Response {
  const key = decodeURIComponent(url.split("/projects/")[1]!).replace(
    "github.com/",
    "",
  );
  if (!(key in scorecards))
    return new Response("project not found", { status: 404 });
  return new Response(
    JSON.stringify({
      scorecard: {
        date: "2026-08-03",
        overallScore: scorecards[key],
        checks: [],
      },
    }),
  );
}

function mockGraphQL(handlers: Partial<Record<Operation, Handler>>) {
  fetchMock.mockImplementation((url, init) => {
    const href = requestUrl(url);
    if (href.includes("/projects/")) {
      return Promise.resolve(replyFromDepsDev(href));
    }

    const body = JSON.parse(bodyText(init?.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    const operation = operationOf(body.query);
    const callIndex = requests.filter(
      (r) => operationOf(r.query) === operation,
    ).length;
    requests.push(body);

    const handler = handlers[operation];
    if (!handler) {
      return Promise.resolve(
        graphQLErrors([`테스트: ${operation} 핸들러가 없습니다`]),
      );
    }
    return Promise.resolve(handler(body.variables, callIndex));
  });
}

const depsDevRequests = () =>
  fetchMock.mock.calls.filter(([url]) =>
    requestUrl(url).includes("/projects/"),
  );

const requestsFor = (operation: Operation) =>
  requests.filter((r) => operationOf(r.query) === operation);

/** 재시도 대기를 흘려보내며 결과를 기다린다. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  const settled = await result;
  if (settled.ok) return settled.value;
  throw settled.error;
}

/* ------------------------------------------------------------------ 데이터 */

const NEXT_JS = repoRef("vercel/next.js");
const MINE = repoRef("octocat/mine", {
  owner: {
    login: "octocat",
    avatarUrl: "https://avatars.githubusercontent.com/octocat",
  },
});
const TOY = toyRepoRef("someone/toy");

const CONTRIBUTIONS = contributionsResponse({
  restrictedContributionsCount: 5,
  contributionCalendar: {
    totalContributions: 6,
    weeks: calendarWeeks("2026-08-09", [1, 2, 3]),
  },
  commitContributionsByRepository: [
    entry(NEXT_JS, 10),
    entry(MINE, 4),
    entry(TOY, 2),
  ],
});

const handlers = (
  open: PullRequestNodeFixture[] = [pullRequestNode()],
  merged: PullRequestNodeFixture[] = [pullRequestNode({ number: 9 })],
) => ({
  contributions: () => ok(CONTRIBUTIONS),
  pullRequests: () => ok(pullRequestsResponse(open, merged)),
});

beforeEach(() => {
  requests.length = 0;
  // 기본값: next.js는 잘 관리되고(8.0 → 80점), toy는 그렇지 않다(1.0 → 10점).
  scorecards = {
    "vercel/next.js": 8.0,
    "octocat/mine": 3.0,
    "someone/toy": 1.0,
  };
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ 테스트 */

describe("모아 오기", () => {
  it("기여 집계와 PR을 한 화면 분량으로 합친다", async () => {
    mockGraphQL(handlers());

    const data = await settle(loadDashboard("t", "1y", KO));

    expect(data.viewer).toEqual(VIEWER);
    expect(data.totals).toEqual({ contributions: 6, restricted: 5 });
    // 외부 기여 12건 / 전체 16건
    expect(data.external).toEqual({ contributions: 12, ratio: 75 });
    expect(data.notable).toEqual({ repos: 1, contributions: 10 });
    expect(data.weeks.flat().map((day) => day.date)).toEqual([
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
    ]);
    expect(data.repos.map((repo) => repo.nameWithOwner)).toEqual([
      "vercel/next.js",
      "octocat/mine",
      "someone/toy",
    ]);
    expect(data.contributionsWarning).toBeNull();
    expect(data.pullRequestsError).toBeNull();
  });

  it("조회 범위에 맞춰 기간 변수를 채운다", async () => {
    mockGraphQL(handlers());

    await settle(loadDashboard("t", "30d", KO));

    const [variables] = requestsFor("contributions").map((r) => r.variables);
    expect(variables!.to).toBe(new Date(NOW).toISOString());
    expect(variables!.from).toBe(new Date(NOW - 30 * 86_400_000).toISOString());
    expect(requestsFor("pullRequests")[0]!.variables.mergedQuery).toContain(
      "merged:>=2026-07-16",
    );
  });

  it("5년 범위는 창을 나눠 여러 번 부른다", async () => {
    mockGraphQL(handlers());

    await settle(loadDashboard("t", "5y", KO));

    expect(requestsFor("contributions")).toHaveLength(5);
    // 여러 창을 부를 때는 어느 구간인지 라벨에 남는다.
    expect(requestsFor("pullRequests")).toHaveLength(1);
  });

  it("기여가 하나도 없으면 비율은 0이다", async () => {
    mockGraphQL({
      contributions: () => ok(contributionsResponse()),
      pullRequests: () => ok(pullRequestsResponse()),
    });

    const data = await settle(loadDashboard("t", "1y", KO));

    expect(data.external).toEqual({ contributions: 0, ratio: 0 });
    expect(data.notable).toEqual({ repos: 0, contributions: 0 });
    expect(data.repos).toEqual([]);
  });
});

describe("Scorecard 점수", () => {
  it("repository와 PR이 가리키는 곳을 한 번에 묻는다", async () => {
    mockGraphQL(handlers());

    await settle(loadDashboard("t", "1y", KO));

    // 기여한 곳 3군데 + PR이 달린 vercel/next.js(이미 포함) → 중복 없이 3번
    expect(depsDevRequests()).toHaveLength(3);
  });

  it("Scorecard 총점을 100점으로 환산해 붙인다", async () => {
    scorecards = {
      "vercel/next.js": 8.0,
      "octocat/mine": 3.0,
      "someone/toy": 1.0,
    };
    mockGraphQL(handlers());

    const { repos } = await settle(loadDashboard("t", "1y", KO));

    expect(repos.map((repo) => [repo.nameWithOwner, repo.impact])).toEqual([
      ["vercel/next.js", 80],
      ["octocat/mine", 30],
      ["someone/toy", 10],
    ]);
  });

  it("Scorecard가 경계선 아래로 내려가면 주요 OSS에서 빠진다", async () => {
    scorecards = { "vercel/next.js": 3.0 };
    mockGraphQL(handlers());

    const data = await settle(loadDashboard("t", "1y", KO));

    expect(data.repos[0]!.impact).toBe(30);
    expect(data.notable).toEqual({ repos: 0, contributions: 0 });
  });

  it("비공개 repository는 묻지 않고 0점으로 둔다", async () => {
    const privateRepo = repoRef("acme/internal", { isPrivate: true });
    mockGraphQL({
      contributions: () =>
        ok(
          contributionsResponse({
            commitContributionsByRepository: [entry(privateRepo, 7)],
          }),
        ),
      pullRequests: () => ok(pullRequestsResponse()),
    });

    const { repos } = await settle(loadDashboard("t", "1y", KO));

    expect(repos[0]!.impact).toBe(0);
    expect(depsDevRequests()).toHaveLength(0);
  });

  it("deps.dev가 모르는 repository는 외부 관심으로 짐작한다", async () => {
    scorecards = {};
    mockGraphQL(handlers());

    const { repos } = await settle(loadDashboard("t", "1y", KO));

    // stars 50,000 / forks 10,000 → 56점
    expect(
      repos.find((r) => r.nameWithOwner === "vercel/next.js")!.impact,
    ).toBe(56);
    // stars 2 / forks 0 → 4점
    expect(repos.find((r) => r.nameWithOwner === "someone/toy")!.impact).toBe(
      4,
    );
  });

  it("deps.dev가 죽어도 대시보드는 그려진다", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGraphQL(handlers());
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url, init) => {
      if (requestUrl(url).includes("/projects/")) {
        return Promise.resolve(new Response("", { status: 503 }));
      }
      return original(url, init);
    });

    const data = await settle(loadDashboard("t", "1y", KO));

    expect(data.totals.contributions).toBe(6);
    expect(
      data.repos.find((r) => r.nameWithOwner === "vercel/next.js")!.impact,
    ).toBe(56);
    expect(warn.mock.calls[0]![0]).toContain("deps.dev");
  });
});

describe("pull request 가공", () => {
  it("검토 상태·체크 상태·기간을 옮긴다", async () => {
    const node = pullRequestNode({
      number: 42,
      title: "fix: 무언가",
      isDraft: true,
      reviewDecision: "CHANGES_REQUESTED",
      updatedAt: "2026-08-10T00:00:00Z",
    });
    mockGraphQL(handlers([node], []));

    const [pr] = (await settle(loadDashboard("t", "1y", KO))).openPullRequests;

    expect(pr).toEqual({
      number: 42,
      title: "fix: 무언가",
      url: "https://github.com/vercel/next.js/pull/42",
      isDraft: true,
      updatedAt: "2026-08-10T00:00:00Z",
      mergedAt: null,
      reviewDecision: "CHANGES_REQUESTED",
      checkState: "SUCCESS",
      repo: "vercel/next.js",
      ownerAvatarUrl: "https://avatars.githubusercontent.com/vercel",
      isPrivate: false,
      impact: 80,
      isStale: false,
    });
    // vercel/next.js의 Scorecard 8.0 → 80점
    expect(pr!.impact).toBe(80);
  });

  it("14일 넘게 조용한 열린 PR은 stale로 본다", async () => {
    mockGraphQL(
      handlers(
        [
          pullRequestNode({ number: 1, updatedAt: "2026-08-01T00:00:00Z" }),
          pullRequestNode({ number: 2, updatedAt: "2026-08-02T00:00:00Z" }),
        ],
        [],
      ),
    );

    const { openPullRequests } = await settle(loadDashboard("t", "1y", KO));
    expect(openPullRequests.map((pr) => pr.isStale)).toEqual([true, false]);
  });

  it("merge된 PR은 오래돼도 stale이 아니다", async () => {
    mockGraphQL(
      handlers(
        [],
        [
          pullRequestNode({
            number: 3,
            updatedAt: "2025-01-01T00:00:00Z",
            mergedAt: "2025-01-01T00:00:00Z",
          }),
        ],
      ),
    );

    const { mergedPullRequests } = await settle(loadDashboard("t", "1y", KO));
    expect(mergedPullRequests[0]!.isStale).toBe(false);
  });

  it.each([
    [
      "체크 결과가 없으면",
      { commits: { nodes: [{ commit: { statusCheckRollup: null } }] } },
    ],
    ["커밋이 비어 있으면", { commits: { nodes: [] } }],
  ])("%s checkState는 null이다", async (_label, overrides) => {
    mockGraphQL(handlers([pullRequestNode(overrides)], []));

    const { openPullRequests } = await settle(loadDashboard("t", "1y", KO));
    expect(openPullRequests[0]!.checkState).toBeNull();
  });

  it("PR이 아닌 검색 결과는 걸러낸다", async () => {
    mockGraphQL({
      contributions: () => ok(CONTRIBUTIONS),
      pullRequests: () =>
        ok({
          open: { issueCount: 2, nodes: [{}, pullRequestNode({ number: 7 })] },
          merged: { issueCount: 0, nodes: [{}] },
        }),
    });

    const data = await settle(loadDashboard("t", "1y", KO));
    expect(data.openPullRequests.map((pr) => pr.number)).toEqual([7]);
    expect(data.mergedPullRequests).toEqual([]);
    // issueCount는 GitHub이 준 값을 그대로 쓴다.
    expect(data.openCount).toBe(2);
  });
});

describe("일부만 실패한 경우", () => {
  it("PR 조회만 실패하면 나머지는 그대로 보여준다", async () => {
    mockGraphQL({
      contributions: () => ok(CONTRIBUTIONS),
      pullRequests: () => graphQLErrors(["쿼리가 너무 큽니다"]),
    });

    const data = await settle(loadDashboard("t", "1y", KO));

    expect(data.totals.contributions).toBe(6);
    expect(data.openPullRequests).toEqual([]);
    expect(data.mergedPullRequests).toEqual([]);
    expect(data.openCount).toBe(0);
    expect(data.pullRequestsError).toBe("쿼리가 너무 큽니다");
  });

  it("PR 조회가 인증 오류면 전체를 실패로 본다", async () => {
    mockGraphQL({
      contributions: () => ok(CONTRIBUTIONS),
      pullRequests: () => httpError(401),
    });

    await expect(settle(loadDashboard("t", "1y", KO))).rejects.toBeInstanceOf(
      GitHubAuthError,
    );
  });

  it("기여 집계 구간 일부가 실패하면 경고와 함께 남은 구간으로 그린다", async () => {
    mockGraphQL({
      contributions: (_variables, callIndex) =>
        callIndex === 0 ? ok(CONTRIBUTIONS) : graphQLErrors(["구간 실패"]),
      pullRequests: () => ok(pullRequestsResponse()),
    });

    const data = await settle(loadDashboard("t", "5y", KO));

    expect(data.contributionsWarning).toBe(
      "5개 구간 중 4개를 불러오지 못해 일부 기간이 빠져 있습니다.",
    );
    expect(data.totals.contributions).toBe(6);
  });

  it("기여 집계가 전부 실패하면 오류를 올린다", async () => {
    mockGraphQL({
      contributions: () => graphQLErrors(["집계 실패"]),
      pullRequests: () => ok(pullRequestsResponse()),
    });

    await expect(settle(loadDashboard("t", "1y", KO))).rejects.toThrow(
      "집계 실패",
    );
  });

  it("기여 집계가 인증 오류면 인증 오류로 올린다", async () => {
    mockGraphQL({
      contributions: () => httpError(401),
      pullRequests: () => ok(pullRequestsResponse()),
    });

    await expect(settle(loadDashboard("t", "1y", KO))).rejects.toBeInstanceOf(
      GitHubAuthError,
    );
  });
});
