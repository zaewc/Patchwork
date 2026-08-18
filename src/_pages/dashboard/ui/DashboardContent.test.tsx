import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  dashboardData,
  dashboardFixture,
  repoStat,
} from "@/_pages/dashboard/api/dashboard.fixtures";
import {
  dashboardQueryKey,
  impactQueryKey,
} from "@/_pages/dashboard/api/dashboardQuery";
import {
  DashboardQueryError,
  fetchDashboard,
  fetchImpact,
} from "@/_pages/dashboard/api/fetchDashboard";
import { DashboardContent } from "@/_pages/dashboard/ui/DashboardContent";
import type { DashboardCore } from "@/_pages/dashboard/api/loadDashboard";
import type { DashboardView } from "@/_pages/dashboard/lib/dashboardView";
import { ROUTES, type RangeKey } from "@/shared/config";
import { dictionaryOf } from "@/shared/lib/i18n-server";

vi.mock("@/_pages/dashboard/api/fetchDashboard", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/_pages/dashboard/api/fetchDashboard")
    >();
  return { ...original, fetchDashboard: vi.fn(), fetchImpact: vi.fn() };
});

const KO = dictionaryOf("ko");
const PARAMS = { range: "1y" as const, showAll: false };

const section = (title: string) =>
  screen.getByRole("heading", { name: title }).closest("section")!;

/** 지표 카드의 이름은 p, 구역 제목은 h2라서 선택자로 가른다. */
const statCard = (label: string) =>
  screen.getByText(label, { selector: "p" }).closest("div")!;

/** 그 구역이 아직 자리만 잡고 있는지 */
const isPlaceholder = (title: string) =>
  section(title).querySelector(".animate-pulse") !== null;

/** 화면이 받는 두 조각을 서버가 내주도록 흉내낸다. */
function serve(view: Partial<DashboardView> = {}) {
  const { core, impact } = dashboardFixture(view);
  vi.mocked(fetchDashboard).mockResolvedValue(core);
  vi.mocked(fetchImpact).mockResolvedValue(impact);
}

/** 이미 받아 둔 범위를 캐시에 심어 둔 채로 화면을 띄운다. 핵심 데이터와 점수표 둘 다 심는다. */
function renderContent(
  cached: Partial<Record<RangeKey, DashboardView>> = {},
  { skipImpact = [] }: { skipImpact?: RangeKey[] } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  for (const [range, view] of Object.entries(cached)) {
    const { core, impact } = dashboardFixture(view);
    queryClient.setQueryData(dashboardQueryKey(range as RangeKey), core);
    if (!skipImpact.includes(range as RangeKey)) {
      queryClient.setQueryData(impactQueryKey(range as RangeKey), impact);
    }
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardContent initialParams={PARAMS} dict={KO} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, "", ROUTES.dashboard);
  // restoreMocks는 vi.spyOn으로 만든 것만 되돌린다. 호출 기록은 직접 비운다.
  vi.mocked(fetchDashboard).mockReset();
  vi.mocked(fetchImpact).mockReset();
  serve();
});

describe("Query 상태", () => {
  it("처음 데이터를 기다릴 때 loading 화면을 보여준다", () => {
    vi.mocked(fetchDashboard).mockReturnValue(new Promise(() => {}));

    const { container } = renderContent();

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    // 골격은 잡혀 있지만 아직 누를 수 있는 것은 없다.
    expect(
      screen.getByRole("heading", { name: "Repositories" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  /**
   * 이 화면의 핵심. deps.dev는 곁가지이므로 그 지연이 화면 전체를 잡고 있으면 안 된다.
   * 점수가 없어도 아는 것 — 사용자 이름·탭·기여 달력·전체 기여 수 — 은 먼저 그린다.
   */
  it("점수를 기다리는 동안에도 점수가 필요 없는 것은 먼저 그린다", () => {
    vi.mocked(fetchImpact).mockReturnValue(new Promise(() => {}));
    renderContent({ "1y": dashboardData() }, { skipImpact: ["1y"] });

    expect(
      screen.getByRole("heading", { level: 1, name: "The Octocat" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "주요 OSS" })).toBeInTheDocument();
    expect(
      screen.getByTitle("2026-08-09 · 4 contributions"),
    ).toBeInTheDocument();
    expect(
      within(statCard("Contributions")).getByText("1,234"),
    ).toBeInTheDocument();
    expect(isPlaceholder("Contributions · 1년")).toBe(false);
  });

  it("점수가 있어야 세는 지표만 숫자 자리를 비워 둔다", () => {
    vi.mocked(fetchImpact).mockReturnValue(new Promise(() => {}));
    renderContent({ "1y": dashboardData() }, { skipImpact: ["1y"] });

    expect(
      within(statCard("주요 OSS 기여")).queryByText("100"),
    ).not.toBeInTheDocument();
    expect(
      statCard("주요 OSS 기여").querySelector(".animate-pulse"),
    ).not.toBeNull();
    // 외부 기여 비중은 소유자만 보면 알 수 있어 함께 기다리지 않는다.
    expect(
      within(statCard("외부 Repository 기여")).getByText("800"),
    ).toBeInTheDocument();
  });

  it("점수가 도착하면 세 목록의 자리를 벗긴다", async () => {
    renderContent({ "1y": dashboardData() }, { skipImpact: ["1y"] });

    expect(
      await screen.findByRole("link", { name: "vercel/next.js" }),
    ).toBeInTheDocument();
    for (const title of [
      "Repositories",
      "Open pull requests",
      "Recently merged",
    ]) {
      expect(isPlaceholder(title)).toBe(false);
    }
    expect(
      within(statCard("주요 OSS 기여")).getByText("100"),
    ).toBeInTheDocument();
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
    expect(fetchImpact).not.toHaveBeenCalled();
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

  /**
   * 핵심 데이터와 점수표는 서로 다른 조회다. 새 기간의 핵심이 먼저 도착하면 GitHub만으로
   * 아는 것부터 바꾸고, 점수가 있어야 걸러낼 세 목록만 자리를 잡는다. 직전 기간의 점수로
   * 걸러 내면 그 기간에 없는 줄이 잠깐 보이기 때문이다.
   */
  it("핵심 데이터만 먼저 오면 그 부분부터 바꾸고 나머지는 자리만 잡는다", () => {
    vi.mocked(fetchImpact).mockReturnValue(new Promise(() => {}));
    renderContent(
      {
        "1y": dashboardData(),
        "30d": dashboardData({
          repos: [repoStat({ nameWithOwner: "other/repo", total: 42 })],
          totals: { contributions: 30, restricted: 0 },
        }),
      },
      { skipImpact: ["30d"] },
    );

    fireEvent.click(screen.getByRole("link", { name: "30일" }));

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(isPlaceholder("Repositories")).toBe(true);
    // 직전 기간의 목록도, 점수를 모르는 새 목록도 보이지 않는다.
    expect(
      screen.queryByRole("link", { name: "vercel/next.js" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "other/repo" }),
    ).not.toBeInTheDocument();
  });

  it("새 기간이 도착하면 흐림을 걷고 그 숫자로 바꾼다", async () => {
    serve({ totals: { contributions: 30, restricted: 0 } });
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
    let finish!: (core: DashboardCore) => void;
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

    finish(
      dashboardFixture({ totals: { contributions: 4321, restricted: 0 } }).core,
    );

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
