import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadImpact } from "@/_pages/dashboard/api/loadImpact";
import { loadScorecards } from "@/entities/repo";

vi.mock("@/entities/repo", () => ({ loadScorecards: vi.fn() }));

beforeEach(() => {
  vi.mocked(loadScorecards).mockResolvedValue(new Map());
});

describe("loadImpact", () => {
  it("건네받은 이름 그대로 물어본다", async () => {
    await loadImpact(["vercel/next.js", "someone/toy"]);

    expect(loadScorecards).toHaveBeenCalledExactlyOnceWith([
      "vercel/next.js",
      "someone/toy",
    ]);
  });

  /** Map은 JSON으로 넘어가지 않는다. 브라우저가 받아 갈 수 있는 모양으로 옮긴다. */
  it("점수표를 쌍의 배열로 옮긴다", async () => {
    vi.mocked(loadScorecards).mockResolvedValue(
      new Map([
        ["vercel/next.js", 8],
        ["nobody/nothing", null],
      ]),
    );

    await expect(
      loadImpact(["vercel/next.js", "nobody/nothing"]),
    ).resolves.toEqual([
      ["vercel/next.js", 8],
      ["nobody/nothing", null],
    ]);
  });
});
