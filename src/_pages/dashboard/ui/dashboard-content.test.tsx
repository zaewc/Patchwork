import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardData } from "@/_pages/dashboard/api/dashboard.fixtures";
import { dashboardQueryKey } from "@/_pages/dashboard/api/dashboard-query";
import {
  DashboardQueryError,
  fetchDashboard,
} from "@/_pages/dashboard/api/fetch-dashboard";
import { DashboardContent } from "@/_pages/dashboard/ui/dashboard-content";
import type { DashboardData } from "@/_pages/dashboard/api/load-dashboard";

vi.mock("@/_pages/dashboard/api/fetch-dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/_pages/dashboard/api/fetch-dashboard")>();
  return { ...original, fetchDashboard: vi.fn() };
});

const PARAMS = { range: "1y" as const, showAll: false };

function renderContent(data?: DashboardData) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (data) queryClient.setQueryData(dashboardQueryKey(PARAMS.range), data);

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardContent params={PARAMS} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchDashboard).mockResolvedValue(dashboardData());
});

describe("Query 상태", () => {
  it("처음 데이터를 기다릴 때 loading 화면을 보여준다", () => {
    vi.mocked(fetchDashboard).mockReturnValue(new Promise(() => {}));

    const { container } = renderContent();

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
  });

  it("처음 조회가 실패하면 재시도 화면을 보여준다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(
      new DashboardQueryError(502, "GitHub API가 응답하지 않습니다."),
    );

    renderContent();

    expect(
      await screen.findByRole("heading", { name: "데이터를 불러오지 못했습니다" }),
    ).toBeInTheDocument();
    expect(screen.getByText("GitHub API가 응답하지 않습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/dashboard?range=1y",
    );
  });

  it("토큰이 만료되면 다시 로그인하도록 안내한다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new DashboardQueryError(401, "만료됨"));

    renderContent();

    expect(
      await screen.findByRole("heading", { name: "세션이 만료되었습니다" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 로그인" })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
  });
});

describe("새로고침", () => {
  it("버튼으로 데이터를 다시 받아 화면을 갱신한다", async () => {
    let finish!: (data: DashboardData) => void;
    vi.mocked(fetchDashboard).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderContent(dashboardData());

    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "새로고침 중…" })).toBeDisabled(),
    );

    finish(dashboardData({ totals: { contributions: 4321, restricted: 0 } }));

    expect(await screen.findByText("4,321")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새로고침" })).toBeEnabled();
  });

  it("갱신만 실패하면 기존 데이터와 실패 사유를 함께 보여준다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new Error("새 데이터 조회 실패"));
    renderContent(dashboardData());

    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));

    expect(await screen.findByText("새 데이터 조회 실패")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });
});
