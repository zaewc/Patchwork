import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadScorecards } from "@/entities/repo/api/load-scorecards";
import type { RepoScoring } from "@/entities/repo/model/scoring";
import { fetchDepsDevProject, type DepsDevProject } from "@/shared/api";

vi.mock("@/shared/api", () => ({ fetchDepsDevProject: vi.fn() }));

const scoring = (key: string, isPrivate = false): RepoScoring => ({
  key,
  signals: { isPrivate, stars: 1_000, forks: 100 },
});

const project = (overallScore: number | null): DepsDevProject =>
  overallScore === null
    ? {}
    : { scorecard: { date: "2026-08-03", overallScore, checks: [] } };

beforeEach(() => {
  vi.mocked(fetchDepsDevProject).mockReset();
});

describe("loadScorecards", () => {
  it("repository별 Scorecard 총점을 모아 온다", async () => {
    vi.mocked(fetchDepsDevProject).mockImplementation(async (key) =>
      project(key === "vercel/next.js" ? 6.2 : 3.8),
    );

    const scorecards = await loadScorecards([scoring("vercel/next.js"), scoring("org/small")]);

    expect(scorecards.get("vercel/next.js")).toBe(6.2);
    expect(scorecards.get("org/small")).toBe(3.8);
  });

  it("평가되지 않은 프로젝트는 null로 둔다", async () => {
    vi.mocked(fetchDepsDevProject).mockResolvedValue(project(null));

    const scorecards = await loadScorecards([scoring("someone/tiny")]);
    expect(scorecards.get("someone/tiny")).toBeNull();
  });

  it("deps.dev가 모르는 repository도 null로 둔다", async () => {
    vi.mocked(fetchDepsDevProject).mockResolvedValue(null);

    const scorecards = await loadScorecards([scoring("nobody/nothing")]);
    expect(scorecards.get("nobody/nothing")).toBeNull();
  });

  it("비공개 repository는 묻지 않는다", async () => {
    vi.mocked(fetchDepsDevProject).mockResolvedValue(project(9));

    const scorecards = await loadScorecards([scoring("acme/internal", true)]);

    expect(fetchDepsDevProject).not.toHaveBeenCalled();
    expect(scorecards.has("acme/internal")).toBe(false);
  });

  it("같은 repository는 한 번만 묻는다", async () => {
    vi.mocked(fetchDepsDevProject).mockResolvedValue(project(7));

    await loadScorecards([
      scoring("vercel/next.js"),
      scoring("vercel/next.js"),
      scoring("vercel/next.js"),
    ]);

    expect(fetchDepsDevProject).toHaveBeenCalledTimes(1);
  });

  it("물을 것이 없으면 요청하지 않는다", async () => {
    const scorecards = await loadScorecards([]);

    expect(fetchDepsDevProject).not.toHaveBeenCalled();
    expect(scorecards.size).toBe(0);
  });

  it("한 곳이 실패해도 나머지는 그대로 받는다", async () => {
    vi.mocked(fetchDepsDevProject).mockImplementation(async (key) => {
      if (key === "flaky/repo") throw new Error("deps.dev 조회 실패 (HTTP 503)");
      return project(8);
    });
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});

    const scorecards = await loadScorecards([scoring("flaky/repo"), scoring("good/repo")]);

    expect(scorecards.get("flaky/repo")).toBeNull();
    expect(scorecards.get("good/repo")).toBe(8);
    expect(warn.mock.calls[0][0]).toContain("deps.dev 조회 1/2건 실패");
  });

  it("전부 성공하면 아무 말도 하지 않는다", async () => {
    vi.mocked(fetchDepsDevProject).mockResolvedValue(project(8));
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});

    await loadScorecards([scoring("good/repo")]);

    expect(warn).not.toHaveBeenCalled();
  });

  it("repository가 많아도 한 번에 16곳까지만 묻는다", async () => {
    let running = 0;
    let peak = 0;
    vi.mocked(fetchDepsDevProject).mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await Promise.resolve();
      running--;
      return project(5);
    });

    await loadScorecards(
      Array.from({ length: 40 }, (_, i) => scoring(`org${i}/repo`)),
    );

    expect(peak).toBe(16);
    expect(fetchDepsDevProject).toHaveBeenCalledTimes(40);
  });
});
