import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchContributionItems } from "@/entities/contribution/api/fetch-contribution-items";
import {
  completedIssueItem,
  mergedPullRequestItem,
  repoRef,
  searchItemsResponse,
  toyRepoRef,
  type ItemNodeFixture,
} from "@/shared/api/github/response.fixtures";

const SINCE = "2025-08-15";

const fetchMock = vi.fn<typeof fetch>();
const requests: { query: string; variables: Record<string, unknown> }[] = [];

const ok = (data: unknown) => new Response(JSON.stringify({ data }));

/** PR 검색과 issue 검색에 각각 다른 결과를 준다. */
function mockSearch(
  reply: (isPullRequestSearch: boolean, page: number) => ReturnType<typeof searchItemsResponse>,
) {
  fetchMock.mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as { query: string; variables: { q: string } };
    const isPullRequestSearch = body.variables.q.includes("is:pr");
    const page = requests.filter(
      (r) => String(r.variables.q).includes("is:pr") === isPullRequestSearch,
    ).length;
    requests.push(body);
    return ok(reply(isPullRequestSearch, page));
  });
}

const queriesOf = () => requests.map((r) => String(r.variables.q));

beforeEach(() => {
  requests.length = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("검색 한정자", () => {
  it("공개 저장소·기간·정렬을 쿼리에 담는다", async () => {
    mockSearch(() => searchItemsResponse([]));

    await fetchContributionItems("t", SINCE);

    for (const query of queriesOf()) {
      expect(query).toContain("author:@me");
      expect(query).toContain("is:public");
      expect(query).toContain(`created:>=${SINCE}`);
      expect(query).toContain("sort:created-asc");
    }
    expect(queriesOf().some((q) => q.includes("is:pr is:merged"))).toBe(true);
    expect(queriesOf().some((q) => q.includes("is:issue is:closed reason:completed"))).toBe(true);
  });
});

describe("묶기", () => {
  it("merge된 PR과 완료된 issue를 repository별로 묶는다", async () => {
    mockSearch((isPullRequestSearch) =>
      searchItemsResponse(isPullRequestSearch ? [mergedPullRequestItem()] : [completedIssueItem()]),
    );

    const groups = await fetchContributionItems("t", SINCE);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      name: "next.js",
      nameWithOwner: "vercel/next.js",
      url: "https://github.com/vercel/next.js",
    });
    expect(groups[0]!.items).toEqual([
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
    // 점수는 여기서 매기지 않는다. deps.dev 조회 뒤에 채워진다.
    expect(groups[0]!.scoring).toEqual({
      key: "vercel/next.js",
      signals: { isPrivate: false, stars: 50_000, forks: 10_000 },
    });
  });

  it("항목 안은 시간순으로 세운다", async () => {
    mockSearch((isPullRequestSearch) =>
      searchItemsResponse(
        isPullRequestSearch
          ? [
              mergedPullRequestItem({ title: "나중", createdAt: "2026-05-01T00:00:00Z" }),
              mergedPullRequestItem({ title: "먼저", createdAt: "2026-01-01T00:00:00Z" }),
            ]
          : [],
      ),
    );

    const groups = await fetchContributionItems("t", SINCE);
    expect(groups[0]!.items.map((item) => item.title)).toEqual(["먼저", "나중"]);
  });

  it("기여가 많은 repository부터, 동점이면 이름 오름차순으로 세운다", async () => {
    const many = repoRef("org/many");
    mockSearch((isPullRequestSearch) =>
      searchItemsResponse(
        isPullRequestSearch
          ? [
              mergedPullRequestItem({ repository: repoRef("org/beta") }),
              mergedPullRequestItem({ repository: repoRef("org/alpha") }),
              mergedPullRequestItem({ repository: many }),
              mergedPullRequestItem({ repository: many, title: "둘째" }),
            ]
          : [],
      ),
    );

    const groups = await fetchContributionItems("t", SINCE);
    expect(groups.map((group) => group.nameWithOwner)).toEqual([
      "org/many",
      "org/alpha",
      "org/beta",
    ]);
  });

  it("작은 repository도 담는다 (걸러내는 곳은 화면이다)", async () => {
    mockSearch((isPullRequestSearch) =>
      searchItemsResponse(
        isPullRequestSearch
          ? [mergedPullRequestItem({ repository: toyRepoRef("someone/toy") })]
          : [],
      ),
    );

    const groups = await fetchContributionItems("t", SINCE);
    expect(groups[0]!.scoring.signals).toEqual({ isPrivate: false, stars: 2, forks: 0 });
  });

  it("결론난 기여가 없으면 빈 목록이다", async () => {
    mockSearch(() => searchItemsResponse([]));
    await expect(fetchContributionItems("t", SINCE)).resolves.toEqual([]);
  });
});

describe("걸러내기", () => {
  it("merge되지 않은 PR과 완료가 아닌 issue는 버린다", async () => {
    mockSearch((isPullRequestSearch) =>
      searchItemsResponse(
        isPullRequestSearch
          ? [mergedPullRequestItem({ mergedAt: null })]
          : [
              completedIssueItem({ stateReason: "NOT_PLANNED" }),
              completedIssueItem({ stateReason: null }),
            ],
      ),
    );

    await expect(fetchContributionItems("t", SINCE)).resolves.toEqual([]);
  });

  it("repository가 없는 검색 결과는 걸러낸다", async () => {
    mockSearch(() => searchItemsResponse([{} as unknown as ItemNodeFixture]));

    await expect(fetchContributionItems("t", SINCE)).resolves.toEqual([]);
  });
});

describe("페이지 넘기기", () => {
  it("다음 페이지가 있으면 커서를 넘겨 이어 받는다", async () => {
    mockSearch((isPullRequestSearch, page) => {
      if (!isPullRequestSearch) return searchItemsResponse([]);
      return page === 0
        ? searchItemsResponse([mergedPullRequestItem({ title: "1페이지" })], {
            hasNextPage: true,
            endCursor: "cursor-1",
          })
        : searchItemsResponse([mergedPullRequestItem({ title: "2페이지" })]);
    });

    const groups = await fetchContributionItems("t", SINCE);

    expect(groups[0]!.items.map((item) => item.title)).toEqual(["1페이지", "2페이지"]);
    const prRequests = requests.filter((r) => String(r.variables.q).includes("is:pr"));
    expect(prRequests.map((r) => r.variables.after)).toEqual([null, "cursor-1"]);
  });

  it("페이지가 끝없이 이어져도 5페이지에서 멈춘다", async () => {
    mockSearch(() => searchItemsResponse([], { hasNextPage: true, endCursor: "next" }));

    await fetchContributionItems("t", SINCE);

    // PR 검색 5페이지 + issue 검색 5페이지
    expect(requests).toHaveLength(10);
  });
});
