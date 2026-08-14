import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calendarWeeks,
  completedIssueItem,
  contributionsResponse,
  entry,
  mergedPullRequestItem,
  pullRequestNode,
  pullRequestsResponse,
  repoRef,
  searchItemsResponse,
  toyRepoRef,
  VIEWER,
} from "@/lib/__fixtures__/github";
import {
  fetchContributionItems,
  fetchDashboard,
  fetchViewerIdentity,
  GitHubAuthError,
  GitHubError,
} from "@/lib/github";

const NOW = Date.parse("2026-08-15T00:00:00Z");
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

/* ------------------------------------------------------------------ 하네스 */

type Operation = "contributions" | "pullRequests" | "items" | "viewer";
type Handler = (variables: Record<string, unknown>, callIndex: number) => Response;

const operationOf = (query: string): Operation =>
  query.includes("query Contributions")
    ? "contributions"
    : query.includes("query PullRequests")
      ? "pullRequests"
      : query.includes("query Items")
        ? "items"
        : "viewer";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

const ok = (data: unknown) => json({ data });
const graphQLErrors = (errors: { message: string; type?: string }[]) => json({ errors });
const httpError = (status: number, body = "") =>
  new Response(body, { status, headers: { "x-github-request-id": "req-1" } });

const fetchMock = vi.fn<typeof fetch>();

type Body = { query: string; variables: Record<string, unknown> };

const requests: Body[] = [];

/** 쿼리 종류별로 응답을 정해 준다. 정해지지 않은 쿼리는 눈에 띄는 오류로 되돌려준다. */
function mockGraphQL(handlers: Partial<Record<Operation, Handler>>) {
  fetchMock.mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as Body;
    const operation = operationOf(body.query);
    const callIndex = requests.filter((r) => operationOf(r.query) === operation).length;
    requests.push(body);

    const handler = handlers[operation];
    if (!handler) {
      return graphQLErrors([{ message: `테스트: ${operation} 핸들러가 없습니다` }]);
    }
    return handler(body.variables, callIndex);
  });
}

const requestsFor = (operation: Operation) =>
  requests.filter((r) => operationOf(r.query) === operation);

/** 재시도 대기(setTimeout)를 흘려보내며 결과를 기다린다. */
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

beforeEach(() => {
  requests.length = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ 전송 계층 */

describe("GraphQL 전송", () => {
  it("토큰과 User-Agent를 담아 POST한다", async () => {
    mockGraphQL({ viewer: () => ok({ viewer: VIEWER }) });

    await expect(settle(fetchViewerIdentity("gho_token"))).resolves.toEqual(VIEWER);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GITHUB_GRAPHQL);
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer gho_token",
      "Content-Type": "application/json",
      "User-Agent": "Patchwork",
    });
    expect(requests[0].query).toContain("viewer");
  });

  it("401은 재시도 없이 인증 오류로 올린다", async () => {
    mockGraphQL({ viewer: () => httpError(401) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toBeInstanceOf(GitHubAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("일시적인 5xx는 세 번까지 다시 시도한다", async () => {
    mockGraphQL({
      viewer: (_variables, callIndex) => (callIndex < 2 ? httpError(502) : ok({ viewer: VIEWER })),
    });

    await expect(settle(fetchViewerIdentity("t"))).resolves.toEqual(VIEWER);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("5xx가 계속되면 상황을 설명하는 오류로 끝난다", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGraphQL({ viewer: () => httpError(503) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow(/HTTP 503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[0].join(" ")).toContain("x-github-request-id=req-1");
  });

  it("request id가 없는 5xx 응답도 기록한다", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGraphQL({ viewer: () => new Response("", { status: 500 }) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow(GitHubError);
    expect(warn.mock.calls[0].join(" ")).toContain("x-github-request-id=none");
  });

  it("재시도 대상이 아닌 HTTP 오류는 본문을 붙여 바로 올린다", async () => {
    mockGraphQL({ viewer: () => new Response("rate limit exceeded", { status: 403 }) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow(
      "GitHub API 오류 (HTTP 403): rate limit exceeded",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("긴 오류 본문은 잘라서 보여준다", async () => {
    mockGraphQL({ viewer: () => new Response("타".repeat(500), { status: 400 }) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow(
      `GitHub API 오류 (HTTP 400): ${"타".repeat(300)}`,
    );
  });

  it("요청 자체가 실패하면 제한 시간을 알려준다", async () => {
    mockGraphQL({});
    fetchMock.mockRejectedValue(new DOMException("aborted", "TimeoutError"));

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow(/20초 안에 끝나지 않았습니다/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("한 번 끊겼다가 이어지면 성공으로 본다", async () => {
    let attempt = 0;
    fetchMock.mockImplementation(async () => {
      if (attempt++ === 0) throw new Error("socket hang up");
      return ok({ viewer: VIEWER });
    });

    await expect(settle(fetchViewerIdentity("t"))).resolves.toEqual(VIEWER);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("제한 시간 안에 끝내라고 신호를 붙인다", async () => {
    mockGraphQL({ viewer: () => ok({ viewer: VIEWER }) });
    await settle(fetchViewerIdentity("t"));
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    ["FORBIDDEN 타입", [{ message: "권한 없음", type: "FORBIDDEN" }]],
    ["Bad credentials 메시지", [{ message: "Bad credentials" }]],
    ["대소문자가 다른 bad credentials", [{ message: "요청 실패: BAD CREDENTIALS" }]],
  ])("%s 는 인증 오류로 올린다", async (_label, errors) => {
    mockGraphQL({ viewer: () => graphQLErrors(errors) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toBeInstanceOf(GitHubAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([["TIMEOUT"], ["SERVICE_UNAVAILABLE"]])(
    "%s 오류는 다시 시도한다",
    async (type) => {
      mockGraphQL({
        viewer: (_variables, callIndex) =>
          callIndex === 0 ? graphQLErrors([{ message: "느립니다", type }]) : ok({ viewer: VIEWER }),
      });

      await expect(settle(fetchViewerIdentity("t"))).resolves.toEqual(VIEWER);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("계속 TIMEOUT이면 GitHub이 준 메시지를 모아 올린다", async () => {
    mockGraphQL({
      viewer: () =>
        graphQLErrors([
          { message: "첫 번째", type: "TIMEOUT" },
          { message: "두 번째", type: "TIMEOUT" },
        ]),
    });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow("첫 번째; 두 번째");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("그 밖의 GraphQL 오류는 재시도 없이 올린다", async () => {
    mockGraphQL({ viewer: () => graphQLErrors([{ message: "Field 'foo' doesn't exist" }]) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow("Field 'foo' doesn't exist");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("data가 비어 있으면 오류로 본다", async () => {
    mockGraphQL({ viewer: () => json({}) });

    await expect(settle(fetchViewerIdentity("t"))).rejects.toThrow("GitHub 응답이 비어 있습니다.");
  });

  it("오류 이름을 구분할 수 있다", () => {
    expect(new GitHubError("x").name).toBe("GitHubError");
    expect(new GitHubAuthError().name).toBe("GitHubAuthError");
    expect(new GitHubAuthError().message).toMatch(/GitHub 토큰/);
    expect(new GitHubAuthError("직접 지정").message).toBe("직접 지정");
  });
});

/* ------------------------------------------------------------------ 대시보드 */

const NEXT_JS = repoRef("vercel/next.js");
const MINE = repoRef("octocat/mine", {
  owner: { login: "octocat", avatarUrl: "https://avatars.githubusercontent.com/octocat" },
});
const TOY = toyRepoRef("someone/toy");

const DASHBOARD_CONTRIBUTIONS = contributionsResponse({
  restrictedContributionsCount: 5,
  contributionCalendar: {
    totalContributions: 6,
    weeks: calendarWeeks("2026-08-09", [1, 2, 3]),
  },
  commitContributionsByRepository: [entry(NEXT_JS, 10), entry(MINE, 4), entry(TOY, 2)],
});

const dashboardHandlers = (open = [pullRequestNode()], merged = [pullRequestNode({ number: 9 })]) => ({
  contributions: () => ok(DASHBOARD_CONTRIBUTIONS),
  pullRequests: () => ok(pullRequestsResponse(open, merged)),
});

describe("fetchDashboard", () => {
  it("기여 집계와 PR을 한 번에 모아 준다", async () => {
    mockGraphQL(dashboardHandlers());

    const data = await settle(fetchDashboard("t", "1y"));

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
    mockGraphQL(dashboardHandlers());

    await settle(fetchDashboard("30d", "30d"));

    const [variables] = requestsFor("contributions").map((r) => r.variables);
    expect(variables.to).toBe(new Date(NOW).toISOString());
    expect(variables.from).toBe(new Date(NOW - 30 * 86_400_000).toISOString());
    expect(requestsFor("pullRequests")[0].variables.mergedQuery).toContain(
      `merged:>=${new Date(NOW - 30 * 86_400_000).toISOString().slice(0, 10)}`,
    );
  });

  it("5년 범위는 창을 나눠 여러 번 부른다", async () => {
    mockGraphQL(dashboardHandlers());

    await settle(fetchDashboard("t", "5y"));

    expect(requestsFor("contributions")).toHaveLength(5);
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
      mockGraphQL(dashboardHandlers([node], []));

      const [pr] = (await settle(fetchDashboard("t", "1y"))).openPullRequests;

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
        impact: pr.impact,
        isStale: false,
      });
      expect(pr.impact).toBeGreaterThanOrEqual(60);
    });

    it("14일 넘게 조용한 열린 PR은 stale로 본다", async () => {
      mockGraphQL(
        dashboardHandlers(
          [
            pullRequestNode({ number: 1, updatedAt: "2026-08-01T00:00:00Z" }),
            pullRequestNode({ number: 2, updatedAt: "2026-08-02T00:00:00Z" }),
          ],
          [],
        ),
      );

      const { openPullRequests } = await settle(fetchDashboard("t", "1y"));
      expect(openPullRequests.map((pr) => pr.isStale)).toEqual([true, false]);
    });

    it("merge된 PR은 오래돼도 stale이 아니다", async () => {
      mockGraphQL(
        dashboardHandlers([], [
          pullRequestNode({
            number: 3,
            updatedAt: "2025-01-01T00:00:00Z",
            mergedAt: "2025-01-01T00:00:00Z",
          }),
        ]),
      );

      const { mergedPullRequests } = await settle(fetchDashboard("t", "1y"));
      expect(mergedPullRequests[0].isStale).toBe(false);
    });

    it.each([
      ["체크 결과가 없으면", { commits: { nodes: [{ commit: { statusCheckRollup: null } }] } }],
      ["커밋이 비어 있으면", { commits: { nodes: [] } }],
    ])("%s checkState는 null이다", async (_label, overrides) => {
      mockGraphQL(dashboardHandlers([pullRequestNode(overrides)], []));

      const { openPullRequests } = await settle(fetchDashboard("t", "1y"));
      expect(openPullRequests[0].checkState).toBeNull();
    });

    it("PR이 아닌 검색 결과는 걸러낸다", async () => {
      mockGraphQL({
        contributions: () => ok(DASHBOARD_CONTRIBUTIONS),
        pullRequests: () =>
          ok({
            open: { issueCount: 2, nodes: [{}, pullRequestNode({ number: 7 })] },
            merged: { issueCount: 0, nodes: [{}] },
          }),
      });

      const data = await settle(fetchDashboard("t", "1y"));
      expect(data.openPullRequests.map((pr) => pr.number)).toEqual([7]);
      expect(data.mergedPullRequests).toEqual([]);
      // issueCount는 GitHub이 준 값을 그대로 쓴다.
      expect(data.openCount).toBe(2);
    });
  });

  describe("일부만 실패한 경우", () => {
    it("PR 조회만 실패하면 나머지는 그대로 보여준다", async () => {
      mockGraphQL({
        contributions: () => ok(DASHBOARD_CONTRIBUTIONS),
        pullRequests: () => graphQLErrors([{ message: "쿼리가 너무 큽니다" }]),
      });

      const data = await settle(fetchDashboard("t", "1y"));

      expect(data.totals.contributions).toBe(6);
      expect(data.openPullRequests).toEqual([]);
      expect(data.mergedPullRequests).toEqual([]);
      expect(data.openCount).toBe(0);
      expect(data.pullRequestsError).toBe("쿼리가 너무 큽니다");
    });

    it("PR 조회가 인증 오류면 전체를 실패로 본다", async () => {
      mockGraphQL({
        contributions: () => ok(DASHBOARD_CONTRIBUTIONS),
        pullRequests: () => httpError(401),
      });

      await expect(settle(fetchDashboard("t", "1y"))).rejects.toBeInstanceOf(GitHubAuthError);
    });

    it("Error가 아닌 값으로 실패해도 안내 문구를 준다", async () => {
      mockGraphQL({ contributions: () => ok(DASHBOARD_CONTRIBUTIONS) });
      const original = fetchMock.getMockImplementation()!;
      fetchMock.mockImplementation(async (url, init) => {
        const body = JSON.parse(String(init?.body)) as Body;
        if (operationOf(body.query) === "pullRequests") throw "문자열 실패";
        return original(url, init);
      });

      const data = await settle(fetchDashboard("t", "1y"));
      expect(data.pullRequestsError).toMatch(/20초 안에 끝나지 않았습니다/);
    });

    it("기여 집계 구간 일부가 실패하면 경고와 함께 남은 구간으로 그린다", async () => {
      mockGraphQL({
        contributions: (_variables, callIndex) =>
          callIndex === 0
            ? ok(DASHBOARD_CONTRIBUTIONS)
            : graphQLErrors([{ message: "구간 실패" }]),
        pullRequests: () => ok(pullRequestsResponse()),
      });

      const data = await settle(fetchDashboard("t", "5y"));

      expect(data.contributionsWarning).toBe(
        "5개 구간 중 4개를 불러오지 못해 일부 기간이 빠져 있습니다.",
      );
      expect(data.totals.contributions).toBe(6);
    });

    it("기여 집계가 전부 실패하면 오류를 올린다", async () => {
      mockGraphQL({
        contributions: () => graphQLErrors([{ message: "집계 실패" }]),
        pullRequests: () => ok(pullRequestsResponse()),
      });

      await expect(settle(fetchDashboard("t", "1y"))).rejects.toThrow("집계 실패");
    });

    it("기여 집계가 인증 오류면 인증 오류로 올린다", async () => {
      mockGraphQL({
        contributions: () => httpError(401),
        pullRequests: () => ok(pullRequestsResponse()),
      });

      await expect(settle(fetchDashboard("t", "1y"))).rejects.toBeInstanceOf(GitHubAuthError);
    });
  });
});

/* ------------------------------------------------------------------ README 내보내기 */

describe("fetchContributionItems", () => {
  const itemsHandler = (pages: ReturnType<typeof searchItemsResponse>[]) => ({
    items: (_variables: Record<string, unknown>, callIndex: number) =>
      ok(pages[Math.min(callIndex, pages.length - 1)]),
  });

  it("merge된 PR과 완료된 issue를 repository별로 묶는다", async () => {
    mockGraphQL({
      items: (variables) =>
        ok(
          searchItemsResponse(
            String(variables.q).includes("is:pr")
              ? [mergedPullRequestItem()]
              : [completedIssueItem()],
          ),
        ),
    });

    const groups = await settle(fetchContributionItems("t", "1y"));

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: "next.js",
      nameWithOwner: "vercel/next.js",
      url: "https://github.com/vercel/next.js",
    });
    expect(groups[0].items).toEqual([
      {
        type: "PR",
        title: "PR 제목",
        url: "https://github.com/vercel/next.js/pull/1",
        createdAt: "2026-03-04T00:00:00Z",
      },
      {
        type: "Issue",
        title: "Issue 제목",
        url: "https://github.com/vercel/next.js/issues/2",
        createdAt: "2026-03-06T00:00:00Z",
      },
    ]);
    expect(groups[0].impact).toBeGreaterThanOrEqual(60);
  });

  it("공개 저장소·기간·정렬 한정자를 쿼리에 담는다", async () => {
    mockGraphQL(itemsHandler([searchItemsResponse([])]));

    await settle(fetchContributionItems("t", "90d"));

    const queries = requestsFor("items").map((r) => String(r.variables.q));
    const since = new Date(NOW - 90 * 86_400_000).toISOString().slice(0, 10);
    for (const query of queries) {
      expect(query).toContain("author:@me");
      expect(query).toContain("is:public");
      expect(query).toContain(`created:>=${since}`);
      expect(query).toContain("sort:created-asc");
    }
    expect(queries.some((q) => q.includes("is:pr is:merged"))).toBe(true);
    expect(queries.some((q) => q.includes("is:issue is:closed reason:completed"))).toBe(true);
  });

  it("항목 안은 시간순으로 세운다", async () => {
    mockGraphQL({
      items: (variables) =>
        ok(
          searchItemsResponse(
            String(variables.q).includes("is:pr")
              ? [
                  mergedPullRequestItem({ title: "나중", createdAt: "2026-05-01T00:00:00Z" }),
                  mergedPullRequestItem({ title: "먼저", createdAt: "2026-01-01T00:00:00Z" }),
                ]
              : [],
          ),
        ),
    });

    const groups = await settle(fetchContributionItems("t", "1y"));
    expect(groups[0].items.map((item) => item.title)).toEqual(["먼저", "나중"]);
  });

  it("기여가 많은 repository부터, 동점이면 이름 오름차순으로 세운다", async () => {
    const beta = repoRef("org/beta");
    const alpha = repoRef("org/alpha");
    const many = repoRef("org/many");

    mockGraphQL({
      items: (variables) =>
        ok(
          searchItemsResponse(
            String(variables.q).includes("is:pr")
              ? [
                  mergedPullRequestItem({ repository: beta }),
                  mergedPullRequestItem({ repository: alpha }),
                  mergedPullRequestItem({ repository: many }),
                  mergedPullRequestItem({ repository: many, title: "둘째" }),
                ]
              : [],
          ),
        ),
    });

    const groups = await settle(fetchContributionItems("t", "1y"));
    expect(groups.map((group) => group.nameWithOwner)).toEqual([
      "org/many",
      "org/alpha",
      "org/beta",
    ]);
  });

  it("merge되지 않은 PR과 완료가 아닌 issue는 버린다", async () => {
    mockGraphQL({
      items: (variables) =>
        ok(
          searchItemsResponse(
            String(variables.q).includes("is:pr")
              ? [mergedPullRequestItem({ mergedAt: null })]
              : [
                  completedIssueItem({ stateReason: "NOT_PLANNED" }),
                  completedIssueItem({ stateReason: null }),
                ],
          ),
        ),
    });

    await expect(settle(fetchContributionItems("t", "1y"))).resolves.toEqual([]);
  });

  it("repository가 없는 검색 결과는 걸러낸다", async () => {
    mockGraphQL(itemsHandler([searchItemsResponse([{}])]));

    await expect(settle(fetchContributionItems("t", "1y"))).resolves.toEqual([]);
  });

  it("다음 페이지가 있으면 커서를 넘겨 이어 받는다", async () => {
    mockGraphQL({
      items: (variables, callIndex) => {
        const isPullRequest = String(variables.q).includes("is:pr");
        if (!isPullRequest) return ok(searchItemsResponse([]));
        // PR 검색만 두 페이지다.
        return callIndex === 0
          ? ok(
              searchItemsResponse([mergedPullRequestItem({ title: "1페이지" })], {
                hasNextPage: true,
                endCursor: "cursor-1",
              }),
            )
          : ok(searchItemsResponse([mergedPullRequestItem({ title: "2페이지" })]));
      },
    });

    const groups = await settle(fetchContributionItems("t", "1y"));

    expect(groups[0].items.map((item) => item.title)).toEqual(["1페이지", "2페이지"]);
    const prRequests = requestsFor("items").filter((r) => String(r.variables.q).includes("is:pr"));
    expect(prRequests.map((r) => r.variables.after)).toEqual([null, "cursor-1"]);
  });

  it("페이지가 끝없이 이어져도 5페이지에서 멈춘다", async () => {
    mockGraphQL({
      items: () =>
        ok(searchItemsResponse([], { hasNextPage: true, endCursor: "next" })),
    });

    await settle(fetchContributionItems("t", "5y"));

    // PR 검색 5페이지 + issue 검색 5페이지
    expect(requestsFor("items")).toHaveLength(10);
  });

  it("주요 OSS가 아닌 repository도 담는다 (걸러내는 곳은 화면이다)", async () => {
    mockGraphQL({
      items: (variables) =>
        ok(
          searchItemsResponse(
            String(variables.q).includes("is:pr")
              ? [mergedPullRequestItem({ repository: TOY })]
              : [],
          ),
        ),
    });

    const groups = await settle(fetchContributionItems("t", "1y"));
    expect(groups[0].impact).toBeLessThan(60);
  });

  it("now를 생략해도 동작한다", async () => {
    mockGraphQL(itemsHandler([searchItemsResponse([])]));
    await expect(settle(fetchContributionItems("t", "30d"))).resolves.toEqual([]);
  });
});
