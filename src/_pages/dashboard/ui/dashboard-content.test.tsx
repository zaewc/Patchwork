import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardData } from "@/_pages/dashboard/api/dashboard.fixtures";
import { dashboardQueryKey } from "@/_pages/dashboard/api/dashboard-query";
import {
  DashboardQueryError,
  fetchDashboard,
} from "@/_pages/dashboard/api/fetch-dashboard";
import { DashboardContent } from "@/_pages/dashboard/ui/dashboard-content";
import type { DashboardData } from "@/_pages/dashboard/api/load-dashboard";
import { ROUTES, type RangeKey } from "@/shared/config";

vi.mock("@/_pages/dashboard/api/fetch-dashboard", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/_pages/dashboard/api/fetch-dashboard")
    >();
  return { ...original, fetchDashboard: vi.fn() };
});

const PARAMS = { range: "1y" as const, showAll: false };

/** 이미 받아 둔 범위를 캐시에 심어 둔 채로 화면을 띄운다. */
function renderContent(cached: Partial<Record<RangeKey, DashboardData>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  for (const [range, data] of Object.entries(cached)) {
    queryClient.setQueryData(dashboardQueryKey(range as RangeKey), data);
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardContent initialParams={PARAMS} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, "", ROUTES.dashboard);
  // restoreMocks는 vi.spyOn으로 만든 것만 되돌린다. 호출 기록은 직접 비운다.
  vi.mocked(fetchDashboard).mockReset();
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
      await screen.findByRole("heading", {
        name: "데이터를 불러오지 못했습니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("GitHub API가 응답하지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/dashboard?range=1y",
    );
  });

  it("토큰이 만료되면 다시 로그인하도록 안내한다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(
      new DashboardQueryError(401, "만료됨"),
    );

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

describe("조회 조건 바꾸기", () => {
  it("이미 받아 둔 기간으로 옮기면 아무것도 다시 묻지 않는다", () => {
    renderContent({
      "1y": dashboardData(),
      "90d": dashboardData({ totals: { contributions: 4321, restricted: 0 } }),
    });

    fireEvent.click(screen.getByRole("link", { name: "90일" }));

    expect(screen.getByText("4,321")).toBeInTheDocument();
    expect(fetchDashboard).not.toHaveBeenCalled();
    // 주소는 따라오되 서버를 다시 다녀오지는 않는다.
    expect(window.location.search).toBe("?range=90d");
  });

  it("보기 범위 전환은 받아 둔 목록을 그 자리에서 걸러낼 뿐이다", () => {
    renderContent({ "1y": dashboardData() });

    fireEvent.click(screen.getByRole("link", { name: "전체" }));

    expect(
      screen.getByRole("link", { name: "someone/toy" }),
    ).toBeInTheDocument();
    expect(fetchDashboard).not.toHaveBeenCalled();
    expect(window.location.search).toBe("?range=1y&scope=all");
  });

  it("아직 못 받은 기간은 직전 화면을 흐린 채로 기다린다", async () => {
    vi.mocked(fetchDashboard).mockReturnValue(new Promise(() => {}));
    const { container } = renderContent({ "1y": dashboardData() });

    fireEvent.click(screen.getByRole("link", { name: "30일" }));

    expect(
      await screen.findByRole("button", { name: "불러오는 중…" }),
    ).toBeDisabled();
    // 스켈레톤으로 비우지 않고 직전 기간의 숫자를 그대로 둔다.
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("새 기간이 도착하면 흐림을 걷고 그 숫자로 바꾼다", async () => {
    vi.mocked(fetchDashboard).mockResolvedValue(
      dashboardData({ totals: { contributions: 30, restricted: 0 } }),
    );
    const { container } = renderContent({ "1y": dashboardData() });

    fireEvent.click(screen.getByRole("link", { name: "30일" }));

    expect(await screen.findByText("30")).toBeInTheDocument();
    expect(fetchDashboard).toHaveBeenCalledExactlyOnceWith("30d");
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("탭에 포인터가 닿으면 누르기 전에 미리 받아 둔다", async () => {
    renderContent({ "1y": dashboardData() });

    await userEvent.hover(screen.getByRole("link", { name: "5년" }));

    await waitFor(() =>
      expect(fetchDashboard).toHaveBeenCalledExactlyOnceWith("5y"),
    );
  });

  it("뒤로 가기를 하면 그때 보던 조건으로 돌아온다", async () => {
    renderContent({
      "1y": dashboardData(),
      "90d": dashboardData({ totals: { contributions: 4321, restricted: 0 } }),
    });
    fireEvent.click(screen.getByRole("link", { name: "90일" }));

    window.history.replaceState(null, "", "/dashboard?range=1y");
    fireEvent.popState(window);

    expect(await screen.findByText("1,234")).toBeInTheDocument();
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
    renderContent({ "1y": dashboardData() });

    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "새로고침 중…" }),
      ).toBeDisabled(),
    );

    finish(dashboardData({ totals: { contributions: 4321, restricted: 0 } }));

    expect(await screen.findByText("4,321")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새로고침" })).toBeEnabled();
  });

  it("갱신만 실패하면 기존 데이터와 실패 사유를 함께 보여준다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(
      new Error("새 데이터 조회 실패"),
    );
    renderContent({ "1y": dashboardData() });

    fireEvent.click(screen.getByRole("button", { name: "새로고침" }));

    expect(await screen.findByText("새 데이터 조회 실패")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });
});
