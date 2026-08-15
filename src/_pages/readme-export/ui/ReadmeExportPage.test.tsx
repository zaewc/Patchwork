import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReadmeExportPage } from "@/_pages/readme-export/ui/ReadmeExportPage";
import {
  NOTABLE_IMPACT,
  PLAIN_IMPACT,
} from "@/_pages/dashboard/api/dashboard.fixtures";
import { loadContributionItems } from "@/_pages/readme-export/api/loadContributionItems";
import type { ContributionGroup } from "@/entities/contribution";
import { getSession } from "@/entities/viewer";
import { GitHubAuthError } from "@/shared/api";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/entities/viewer", () => ({ getSession: vi.fn() }));
vi.mock("@/_pages/readme-export/api/loadContributionItems", () => ({
  loadContributionItems: vi.fn(),
}));

class RedirectSignal extends Error {}

const SESSION = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const group = (
  overrides: Partial<ContributionGroup> = {},
): ContributionGroup => {
  const nameWithOwner = overrides.nameWithOwner ?? "vercel/next.js";
  return {
    name: nameWithOwner.split("/")[1] ?? nameWithOwner,
    nameWithOwner,
    url: `https://github.com/${nameWithOwner}`,
    impact: NOTABLE_IMPACT,
    items: [
      {
        type: "PR",
        title: "fix: hydration mismatch",
        url: `https://github.com/${nameWithOwner}/pull/1`,
        createdAt: "2026-03-04T00:00:00Z",
      },
    ],
    ...overrides,
  };
};

const props = (
  searchParams: Record<string, string | string[] | undefined> = {},
): PageProps<"/export"> => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(searchParams),
});

const renderPage = async (
  groups: ContributionGroup[] = [group()],
  searchParams?: Record<string, string | string[] | undefined>,
) => {
  vi.mocked(loadContributionItems).mockResolvedValue(groups);
  return render(await ReadmeExportPage(props(searchParams)));
};

beforeEach(() => {
  vi.mocked(redirect).mockReset();
  vi.mocked(redirect).mockImplementation(() => {
    throw new RedirectSignal();
  });
  vi.mocked(getSession).mockResolvedValue(SESSION);
});

describe("접근 제어", () => {
  it("세션이 없으면 홈으로 보낸다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(ReadmeExportPage(props())).rejects.toBeInstanceOf(
      RedirectSignal,
    );
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("세션의 토큰과 조회 범위로 기여 목록을 가져온다", async () => {
    await renderPage([group()], { range: "5y" });
    expect(loadContributionItems).toHaveBeenCalledExactlyOnceWith(
      "gho_token",
      "5y",
    );
  });

  it("토큰이 만료되면 다시 로그인하도록 보낸다", async () => {
    vi.mocked(loadContributionItems).mockRejectedValue(new GitHubAuthError());

    await expect(ReadmeExportPage(props())).rejects.toBeInstanceOf(
      RedirectSignal,
    );
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/api/auth/login");
  });

  it("로그인한 사용자를 헤더에 보여준다", async () => {
    await renderPage();
    expect(
      screen.getByRole("link", { name: "The Octocat" }),
    ).toBeInTheDocument();
  });
});

describe("머리글", () => {
  it("무엇을 만드는 화면인지 설명한다", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "README 내보내기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/repository별로 묶어 Markdown으로 만듭니다/),
    ).toBeInTheDocument();
  });

  it("탭은 export 경로를 가리킨다", async () => {
    await renderPage([group()], { range: "90d" });

    expect(screen.getByRole("link", { name: "주요 OSS" })).toHaveAttribute(
      "href",
      "/export?range=90d",
    );
    expect(screen.getByRole("link", { name: "전체" })).toHaveAttribute(
      "href",
      "/export?range=90d&scope=all",
    );
    expect(screen.getByRole("link", { name: "5년" })).toHaveAttribute(
      "href",
      "/export?range=5y",
    );
  });

  it("현재 조회 조건을 표시한다", async () => {
    await renderPage([group()], { range: "30d", scope: "all" });

    expect(screen.getByRole("link", { name: "30일" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "전체" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("Markdown", () => {
  it("기여를 Markdown으로 만들어 보여준다", async () => {
    const { container } = await renderPage();

    const pre = container.querySelector("pre")!;
    expect(pre.textContent).toBe(
      "### next.js\n\n- `26-03-04` **PR** | [fix: hydration mismatch](https://github.com/vercel/next.js/pull/1)",
    );
  });

  it("repository 수와 항목 수를 센다", async () => {
    await renderPage([
      group(),
      group({
        nameWithOwner: "vitejs/vite",
        items: [
          {
            type: "PR",
            title: "a",
            url: "https://x/1",
            createdAt: "2026-01-01",
          },
          {
            type: "Issue",
            title: "b",
            url: "https://x/2",
            createdAt: "2026-01-02",
          },
        ],
      }),
    ]);

    expect(screen.getByText("repository 2곳 · 3건")).toBeInTheDocument();
  });

  it("복사 버튼을 함께 준다", async () => {
    await renderPage();
    expect(
      screen.getByRole("button", { name: "Markdown 복사" }),
    ).toBeInTheDocument();
  });
});

describe("주요 OSS 걸러내기", () => {
  it("기본은 주요 OSS만 담는다", async () => {
    const { container } = await renderPage([
      group(),
      group({ nameWithOwner: "someone/toy", impact: PLAIN_IMPACT }),
    ]);

    expect(container.querySelector("pre")!.textContent).toContain(
      "### next.js",
    );
    expect(container.querySelector("pre")!.textContent).not.toContain(
      "### toy",
    );
    expect(screen.getByText("repository 1곳 · 1건")).toBeInTheDocument();
  });

  it("전체 모드에서는 일반 프로젝트까지 담는다", async () => {
    const { container } = await renderPage(
      [group(), group({ nameWithOwner: "someone/toy", impact: PLAIN_IMPACT })],
      { scope: "all" },
    );

    expect(container.querySelector("pre")!.textContent).toContain("### toy");
    expect(screen.getByText("repository 2곳 · 2건")).toBeInTheDocument();
  });
});

describe("내보낼 것이 없을 때", () => {
  it("기간을 넓히거나 전체로 전환하라고 안내한다", async () => {
    const { container } = await renderPage([]);

    expect(container.querySelector("pre")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Markdown 복사" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "이 기간에 merge된 pull request나 완료된 issue가 없습니다. 기간을 넓히거나 전체로 전환해 보세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("repository 0곳 · 0건")).toBeInTheDocument();
  });
});

describe("조회 실패", () => {
  it("사유를 배너로 알리고 다시 시도하라고 안내한다", async () => {
    vi.mocked(loadContributionItems).mockRejectedValue(
      new Error("GitHub API 오류 (HTTP 403)"),
    );
    render(await ReadmeExportPage(props()));

    expect(screen.getByText("GitHub API 오류 (HTTP 403)")).toBeInTheDocument();
    expect(screen.getByText("다시 시도해 주세요.")).toBeInTheDocument();
  });

  it("Error가 아닌 값으로 실패해도 화면은 그린다", async () => {
    vi.mocked(loadContributionItems).mockRejectedValue("문자열 실패");
    render(await ReadmeExportPage(props()));

    expect(
      screen.getByText("기여 목록을 불러오지 못했습니다."),
    ).toBeInTheDocument();
  });
});
