import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardData } from "@/_pages/dashboard/api/dashboard.fixtures";
import {
  DashboardQueryError,
  fetchDashboard,
  fetchImpact,
} from "@/_pages/dashboard/api/fetchDashboard";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("fetchDashboard", () => {
  it("조회 범위를 API 주소에 담고 HTTP 캐시는 쓰지 않는다", async () => {
    const data = dashboardData();
    vi.mocked(fetch).mockResolvedValue(Response.json({ data }));

    await expect(fetchDashboard("90d")).resolves.toEqual(data);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/dashboard?range=90d", {
      cache: "no-store",
    });
  });

  it("실패 응답의 상태와 문구를 Query 오류로 보존한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    );

    const error = await fetchDashboard("1y").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DashboardQueryError);
    expect(error).toMatchObject({
      name: "DashboardQueryError",
      status: 401,
      message: "로그인이 필요합니다.",
    });
  });
});

describe("fetchImpact", () => {
  /** 이름이 수백 개까지 늘 수 있어 주소에 담지 못한다. 그래서 POST로 몸통에 싣는다. */
  it("물어볼 이름을 몸통에 실어 보낸다", async () => {
    const data: [string, number | null][] = [["vercel/next.js", 8]];
    vi.mocked(fetch).mockResolvedValue(Response.json({ data }));

    await expect(fetchImpact(["vercel/next.js"])).resolves.toEqual(data);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: ["vercel/next.js"] }),
      cache: "no-store",
    });
  });

  it("실패 응답의 상태와 문구를 Query 오류로 보존한다", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    );

    const error = await fetchImpact(["a/b"]).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      name: "DashboardQueryError",
      status: 401,
      message: "로그인이 필요합니다.",
    });
  });
});
