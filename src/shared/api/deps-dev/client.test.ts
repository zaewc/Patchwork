import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDepsDevProject } from "@/shared/api/deps-dev/client";

const fetchMock = vi.fn<typeof fetch>();

const PROJECT = {
  projectKey: { id: "github.com/vercel/next.js" },
  starsCount: 141_704,
  forksCount: 31_718,
  license: "MIT",
  scorecard: {
    date: "2026-08-03T00:00:00Z",
    overallScore: 6.2,
    checks: [{ name: "Maintained", score: 10, reason: "30 commit(s) found" }],
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("fetchDepsDevProject", () => {
  it("GitHub 이름을 deps.dev 프로젝트 키로 바꿔 묻는다", async () => {
    fetchMock.mockResolvedValue(json(PROJECT));

    await fetchDepsDevProject("vercel/next.js");

    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://api.deps.dev/v3/projects/github.com%2Fvercel%2Fnext.js",
    );
  });

  it("이름에 든 특수문자도 안전하게 감싼다", async () => {
    fetchMock.mockResolvedValue(json(PROJECT));

    await fetchDepsDevProject("some-org/repo.with+chars");

    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://api.deps.dev/v3/projects/github.com%2Fsome-org%2Frepo.with%2Bchars",
    );
  });

  it("Scorecard를 담은 프로젝트를 돌려준다", async () => {
    fetchMock.mockResolvedValue(json(PROJECT));

    const project = await fetchDepsDevProject("vercel/next.js");
    expect(project?.scorecard?.overallScore).toBe(6.2);
    expect(project?.starsCount).toBe(141_704);
  });

  it("아직 평가되지 않은 프로젝트에는 scorecard가 없다", async () => {
    fetchMock.mockResolvedValue(json({ starsCount: 3, forksCount: 0 }));

    const project = await fetchDepsDevProject("someone/tiny");
    expect(project?.scorecard).toBeUndefined();
  });

  it("deps.dev가 모르는 repository는 null이다", async () => {
    fetchMock.mockResolvedValue(new Response("project not found", { status: 404 }));

    await expect(fetchDepsDevProject("nobody/nothing")).resolves.toBeNull();
  });

  it("그 밖의 실패는 어느 repository였는지 남기고 올린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 503 }));

    await expect(fetchDepsDevProject("vercel/next.js")).rejects.toThrow(
      "deps.dev 조회 실패 (HTTP 503): vercel/next.js",
    );
  });

  it("요청이 끝나지 않으면 끊는다", async () => {
    fetchMock.mockResolvedValue(json(PROJECT));

    await fetchDepsDevProject("vercel/next.js");

    expect(fetchMock.mock.calls[0]![1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("deps.dev가 정한 수명만큼 캐시한다", async () => {
    fetchMock.mockResolvedValue(json(PROJECT));

    await fetchDepsDevProject("vercel/next.js");

    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ next: { revalidate: 3600 } });
  });
});
