import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadContributionItems } from "@/_pages/readme-export/api/load-contribution-items";
import { fetchContributionItems } from "@/entities/contribution";
import { rangeStartDate } from "@/shared/config";

vi.mock("@/entities/contribution", () => ({ fetchContributionItems: vi.fn() }));

const NOW = Date.parse("2026-08-15T00:00:00Z");

beforeEach(() => {
  vi.mocked(fetchContributionItems).mockReset();
  vi.mocked(fetchContributionItems).mockResolvedValue([]);
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

  it("가져온 목록을 그대로 돌려준다", async () => {
    const groups = [
      {
        name: "next.js",
        nameWithOwner: "vercel/next.js",
        url: "https://github.com/vercel/next.js",
        impact: 100,
        items: [],
      },
    ];
    vi.mocked(fetchContributionItems).mockResolvedValue(groups);

    await expect(loadContributionItems("t", "1y")).resolves.toBe(groups);
  });

  it("실패는 감추지 않고 그대로 올린다", async () => {
    vi.mocked(fetchContributionItems).mockRejectedValue(new Error("검색 실패"));

    await expect(loadContributionItems("t", "1y")).rejects.toThrow("검색 실패");
  });
});
