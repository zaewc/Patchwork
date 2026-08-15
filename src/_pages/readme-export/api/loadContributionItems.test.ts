import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadContributionItems } from "@/_pages/readme-export/api/loadContributionItems";
import { fetchContributionItems } from "@/entities/contribution";
import type { ContributionGroup } from "@/entities/contribution";
import { loadScorecards } from "@/entities/repo";
import type { Unscored } from "@/entities/repo";
import { rangeStartDate } from "@/shared/config";

vi.mock("@/entities/contribution", () => ({ fetchContributionItems: vi.fn() }));
vi.mock("@/entities/repo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/repo")>()),
  loadScorecards: vi.fn(),
}));

const NOW = Date.parse("2026-08-15T00:00:00Z");

const group = (nameWithOwner: string, stars = 50_000) =>
  ({
    name: nameWithOwner.split("/")[1],
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    scoring: {
      key: nameWithOwner,
      signals: { isPrivate: false, stars, forks: 0 },
    },
    items: [],
  }) as unknown as Unscored<ContributionGroup>;

beforeEach(() => {
  vi.mocked(fetchContributionItems).mockReset();
  vi.mocked(fetchContributionItems).mockResolvedValue([]);
  vi.mocked(loadScorecards).mockReset();
  vi.mocked(loadScorecards).mockResolvedValue(new Map());
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadContributionItems", () => {
  it.each(["30d", "90d", "1y", "5y"] as const)(
    "%s 범위를 시작 날짜로 바꿔 넘긴다",
    async (range) => {
      await loadContributionItems("gho_token", range);

      expect(fetchContributionItems).toHaveBeenCalledExactlyOnceWith(
        "gho_token",
        rangeStartDate(range, NOW),
      );
    },
  );

  it("기여한 repository들의 Scorecard를 한 번에 묻는다", async () => {
    vi.mocked(fetchContributionItems).mockResolvedValue([
      group("vercel/next.js"),
      group("someone/toy", 2),
    ]);

    await loadContributionItems("t", "1y");

    expect(loadScorecards).toHaveBeenCalledExactlyOnceWith([
      {
        key: "vercel/next.js",
        signals: { isPrivate: false, stars: 50_000, forks: 0 },
      },
      { key: "someone/toy", signals: { isPrivate: false, stars: 2, forks: 0 } },
    ]);
  });

  it("Scorecard 총점을 100점으로 환산해 붙인다", async () => {
    vi.mocked(fetchContributionItems).mockResolvedValue([
      group("vercel/next.js"),
    ]);
    vi.mocked(loadScorecards).mockResolvedValue(
      new Map([["vercel/next.js", 8.5]]),
    );

    const groups = await loadContributionItems("t", "1y");

    expect(groups[0]!.impact).toBe(85);
    expect("scoring" in groups[0]!).toBe(false);
  });

  it("deps.dev가 모르는 repository는 외부 관심으로 짐작한다", async () => {
    vi.mocked(fetchContributionItems).mockResolvedValue([
      group("someone/toy", 2),
    ]);

    const groups = await loadContributionItems("t", "1y");

    expect(groups[0]!.impact).toBe(4);
  });

  it("내보낼 기여가 없으면 빈 목록이다", async () => {
    await expect(loadContributionItems("t", "1y")).resolves.toEqual([]);
  });

  it("실패는 감추지 않고 그대로 올린다", async () => {
    vi.mocked(fetchContributionItems).mockRejectedValue(new Error("검색 실패"));

    await expect(loadContributionItems("t", "1y")).rejects.toThrow("검색 실패");
  });
});
