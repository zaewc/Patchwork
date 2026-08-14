import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import {
  dashboardData,
  PLAIN_IMPACT,
  pullRequest,
  repoStat,
} from "@/lib/__fixtures__/dashboard";
import { fetchDashboard, GitHubAuthError, type DashboardData } from "@/lib/github";
import { getSession } from "@/lib/session";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/github", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github")>()),
  fetchDashboard: vi.fn(),
}));

class RedirectSignal extends Error {}

const SESSION = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const props = (
  searchParams: Record<string, string | string[] | undefined> = {},
): PageProps<"/dashboard"> => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(searchParams),
});

const renderPage = async (
  data: Partial<DashboardData> = {},
  searchParams?: Record<string, string | string[] | undefined>,
) => {
  vi.mocked(fetchDashboard).mockResolvedValue(dashboardData(data));
  return render(await DashboardPage(props(searchParams)));
};

const section = (title: string) =>
  screen.getByRole("heading", { name: title }).closest("section")!;

/** 지표 카드의 이름은 p, 구역 제목은 h2라서 선택자로 가른다. */
const statCard = (label: string) => screen.getByText(label, { selector: "p" }).closest("div")!;

beforeEach(() => {
  vi.mocked(redirect).mockReset();
  vi.mocked(redirect).mockImplementation((() => {
    throw new RedirectSignal();
  }) as never);
  vi.mocked(getSession).mockResolvedValue(SESSION);
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse("2026-08-15T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("접근 제어", () => {
  it("세션이 없으면 홈으로 보낸다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(DashboardPage(props())).rejects.toBeInstanceOf(RedirectSignal);
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("세션의 토큰과 조회 범위로 데이터를 가져온다", async () => {
    await renderPage({}, { range: "90d" });
    expect(fetchDashboard).toHaveBeenCalledExactlyOnceWith("gho_token", "90d");
  });
});

describe("조회 실패", () => {
  it("토큰이 만료되면 다시 로그인하도록 안내한다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new GitHubAuthError());
    render(await DashboardPage(props()));

    expect(screen.getByRole("heading", { name: "세션이 만료되었습니다" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 로그인" })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
  });

  it("그 밖의 실패는 사유와 재시도 링크를 보여준다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new Error("GitHub가 쿼리를 끝내지 못했습니다"));
    render(await DashboardPage(props()));

    expect(screen.getByRole("heading", { name: "데이터를 불러오지 못했습니다" })).toBeInTheDocument();
    expect(screen.getByText("GitHub가 쿼리를 끝내지 못했습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/dashboard?range=1y",
    );
  });

  it("Error가 아닌 값으로 실패해도 화면은 그린다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue("문자열 실패");
    render(await DashboardPage(props()));

    expect(screen.getByText("알 수 없는 오류가 발생했습니다.")).toBeInTheDocument();
  });

  it("재시도 링크는 보고 있던 조회 조건을 유지한다", async () => {
    vi.mocked(fetchDashboard).mockRejectedValue(new Error("실패"));
    render(await DashboardPage(props({ range: "5y", scope: "all" })));

    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/dashboard?range=5y&scope=all",
    );
  });
});

describe("머리글", () => {
  it("사용자 이름을 제목으로 쓴다", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "The Octocat" })).toBeInTheDocument();
  });

  it("이름이 없으면 login을 쓴다", async () => {
    await renderPage({
      viewer: { login: "octocat", name: null, avatarUrl: "https://avatars.example/1" },
    });
    expect(screen.getByRole("heading", { level: 1, name: "octocat" })).toBeInTheDocument();
  });
});

describe("지표", () => {
  it("전체 기여 수를 보여준다", async () => {
    await renderPage();
    expect(within(statCard("Contributions")).getByText("1,234")).toBeInTheDocument();
  });

  it("비공개 기여가 있으면 함께 알려준다", async () => {
    await renderPage({ totals: { contributions: 1234, restricted: 1200 } });
    expect(screen.getByText("Private 1,200건 포함")).toBeInTheDocument();
  });

  it("비공개 기여가 없으면 덧붙이지 않는다", async () => {
    await renderPage();
    expect(screen.queryByText(/Private .*건 포함/)).not.toBeInTheDocument();
  });

  it("주요 OSS 기여와 repository 수를 보여준다", async () => {
    await renderPage();

    const card = statCard("주요 OSS 기여");
    expect(within(card).getByText("500")).toBeInTheDocument();
    expect(within(card).getByText("repository 3곳")).toBeInTheDocument();
  });

  it("외부 repository 기여 비중을 보여준다", async () => {
    await renderPage();

    const card = statCard("외부 Repository 기여");
    expect(within(card).getByText("800")).toBeInTheDocument();
    expect(within(card).getByText("전체의 65%")).toBeInTheDocument();
  });

  it("주요 OSS 모드에서는 걸러진 열린 PR 수를 센다", async () => {
    await renderPage();
    expect(within(statCard("Open pull requests")).getByText("1")).toBeInTheDocument();
  });

  it("전체 모드에서는 GitHub이 준 전체 건수를 쓴다", async () => {
    await renderPage({}, { scope: "all" });
    expect(within(statCard("Open pull requests")).getByText("7")).toBeInTheDocument();
  });

  it("stale이 있으면 그 수를 알려준다", async () => {
    await renderPage({ openPullRequests: [pullRequest({ isStale: true })] });
    expect(screen.getByText("Stale 1건")).toBeInTheDocument();
  });

  it("stale이 없으면 merge된 수를 알려준다", async () => {
    await renderPage();
    expect(screen.getByText("Merged 1건")).toBeInTheDocument();
  });
});

describe("탭", () => {
  it("범위 탭은 현재 조회 조건을 유지한다", async () => {
    await renderPage({}, { range: "90d" });

    expect(screen.getByRole("link", { name: "주요 OSS" })).toHaveAttribute(
      "href",
      "/dashboard?range=90d",
    );
    expect(screen.getByRole("link", { name: "전체" })).toHaveAttribute(
      "href",
      "/dashboard?range=90d&scope=all",
    );
  });

  it("기본은 주요 OSS 탭이 선택돼 있다", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: "주요 OSS" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "전체" })).not.toHaveAttribute("aria-current");
  });

  it("기간 탭 네 개를 보여주고 현재 기간을 표시한다", async () => {
    await renderPage({}, { range: "90d", scope: "all" });

    for (const [label, range] of [
      ["30일", "30d"],
      ["90일", "90d"],
      ["1년", "1y"],
      ["5년", "5y"],
    ]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        `/dashboard?range=${range}&scope=all`,
      );
    }
    expect(screen.getByRole("link", { name: "90일" })).toHaveAttribute("aria-current", "page");
  });
});

describe("경고", () => {
  it("일부 기간을 못 불러오면 알려준다", async () => {
    await renderPage({ contributionsWarning: "5개 구간 중 1개를 불러오지 못했습니다." });
    expect(screen.getByText("5개 구간 중 1개를 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("PR 조회만 실패해도 알려준다", async () => {
    await renderPage({ pullRequestsError: "PR을 불러오지 못했습니다." });
    expect(screen.getByText("PR을 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("두 경고를 함께 보여준다", async () => {
    await renderPage({ contributionsWarning: "구간 경고", pullRequestsError: "PR 경고" });

    expect(screen.getByText("구간 경고")).toBeInTheDocument();
    expect(screen.getByText("PR 경고")).toBeInTheDocument();
  });

  it("문제가 없으면 경고를 띄우지 않는다", async () => {
    const { container } = await renderPage();
    expect(container.querySelectorAll(".border-warn\\/40")).toHaveLength(0);
  });
});

describe("본문", () => {
  it("조회 기간을 제목에 적는다", async () => {
    await renderPage({}, { range: "5y" });
    expect(screen.getByRole("heading", { name: "Contributions · 5년" })).toBeInTheDocument();
  });

  it("기여 달력을 그린다", async () => {
    await renderPage();
    expect(screen.getByTitle("2026-08-09 · 4 contributions")).toBeInTheDocument();
  });

  it("네 구역을 순서대로 그린다", async () => {
    await renderPage();

    for (const title of ["Repositories", "Open pull requests", "Recently merged"]) {
      expect(section(title)).toBeInTheDocument();
    }
  });
});

describe("주요 OSS 걸러내기", () => {
  it("기본은 주요 OSS만 세 목록에 남긴다", async () => {
    await renderPage();

    expect(within(section("Repositories")).getByRole("link", { name: "vercel/next.js" })).toBeInTheDocument();
    expect(
      within(section("Repositories")).queryByRole("link", { name: "someone/toy" }),
    ).not.toBeInTheDocument();
    expect(within(section("Open pull requests")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("전체 모드에서는 일반 프로젝트까지 보여준다", async () => {
    await renderPage({}, { scope: "all" });

    expect(
      within(section("Repositories")).getByRole("link", { name: "someone/toy" }),
    ).toBeInTheDocument();
    expect(within(section("Open pull requests")).getAllByRole("listitem")).toHaveLength(2);
  });

  it("전체 모드의 repository 목록은 10곳까지만 보여준다", async () => {
    const repos = Array.from({ length: 12 }, (_, i) =>
      repoStat({ nameWithOwner: `org${i}/repo`, total: 100 - i }),
    );
    await renderPage({ repos }, { scope: "all" });

    expect(within(section("Repositories")).getAllByRole("row")).toHaveLength(11);
  });

  it("주요 OSS 모드에서는 목록을 자르지 않는다", async () => {
    const repos = Array.from({ length: 12 }, (_, i) =>
      repoStat({ nameWithOwner: `org${i}/repo`, total: 100 - i }),
    );
    await renderPage({ repos });

    expect(within(section("Repositories")).getAllByRole("row")).toHaveLength(13);
  });

  describe("걸러서 목록이 비었을 때", () => {
    const plainOnly = {
      repos: [repoStat({ nameWithOwner: "someone/toy", impact: PLAIN_IMPACT })],
      openPullRequests: [pullRequest({ impact: PLAIN_IMPACT })],
      mergedPullRequests: [
        pullRequest({ number: 9, impact: PLAIN_IMPACT, mergedAt: "2026-08-14T00:00:00Z" }),
      ],
    };

    it("전체로 전환하면 볼 수 있다고 안내한다", async () => {
      await renderPage(plainOnly);

      expect(
        screen.getByText(
          "기여한 repository 1곳이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "열린 pull request 1건이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "merge된 pull request 1건이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
        ),
      ).toBeInTheDocument();
    });

    it("원래 기여가 없으면 각 구역의 기본 문구를 쓴다", async () => {
      await renderPage({ repos: [], openPullRequests: [], mergedPullRequests: [] });

      expect(screen.getByText("이 기간에 기여한 repository가 없습니다.")).toBeInTheDocument();
      expect(screen.getByText("열려 있는 pull request가 없습니다.")).toBeInTheDocument();
      expect(screen.getByText("이 기간에 merge된 pull request가 없습니다.")).toBeInTheDocument();
    });
  });
});
