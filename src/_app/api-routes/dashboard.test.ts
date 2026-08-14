import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDashboard } from "@/_app/api-routes/dashboard";
import { loadDashboard } from "@/_pages/dashboard";
import { dashboardData } from "@/_pages/dashboard/api/dashboard.fixtures";
import { getSession } from "@/entities/viewer";
import { GitHubAuthError } from "@/shared/api";

vi.mock("@/_pages/dashboard", () => ({ loadDashboard: vi.fn() }));
vi.mock("@/entities/viewer", () => ({ getSession: vi.fn() }));

const SESSION = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const request = (range = "90d") => new Request(`http://localhost:3000/api/dashboard?range=${range}`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(SESSION);
  vi.mocked(loadDashboard).mockResolvedValue(dashboardData());
});

describe("GET /api/dashboard", () => {
  it("로그인하지 않았으면 데이터를 내주지 않는다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const response = await handleDashboard(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "로그인이 필요합니다." });
    expect(loadDashboard).not.toHaveBeenCalled();
  });

  it("세션 토큰과 조회 범위로 대시보드를 불러온다", async () => {
    const data = dashboardData();
    vi.mocked(loadDashboard).mockResolvedValue(data);

    const response = await handleDashboard(request("5y"));

    expect(loadDashboard).toHaveBeenCalledExactlyOnceWith("gho_token", "5y");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data });
  });

  it("알 수 없는 조회 범위는 기본값으로 고친다", async () => {
    await handleDashboard(request("forever"));
    expect(loadDashboard).toHaveBeenCalledExactlyOnceWith("gho_token", "1y");
  });

  it("GitHub 토큰이 만료되면 401로 구분한다", async () => {
    vi.mocked(loadDashboard).mockRejectedValue(new GitHubAuthError("다시 로그인해 주세요."));

    const response = await handleDashboard(request());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "다시 로그인해 주세요." });
  });

  it("그 밖의 실패는 사유와 함께 502로 응답한다", async () => {
    vi.mocked(loadDashboard).mockRejectedValue(new Error("GitHub API가 응답하지 않습니다."));

    const response = await handleDashboard(request());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "GitHub API가 응답하지 않습니다.",
    });
  });

  it("Error가 아닌 실패에는 기본 문구를 쓴다", async () => {
    vi.mocked(loadDashboard).mockRejectedValue("문자열 실패");

    const response = await handleDashboard(request());

    await expect(response.json()).resolves.toEqual({
      error: "대시보드 데이터를 불러오지 못했습니다.",
    });
  });
});
