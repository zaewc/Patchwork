import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "@/_pages/dashboard/ui/DashboardLayout";
import { getSession } from "@/entities/viewer";

vi.mock("@/entities/viewer", () => ({ getSession: vi.fn() }));

const SESSION = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const props = (children: React.ReactNode): LayoutProps<"/dashboard"> => ({
  children,
  params: Promise.resolve({}),
});

const renderLayout = async () =>
  render(await DashboardLayout(props(<main>본문</main>)));

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue(SESSION);
});

describe("DashboardLayout", () => {
  /**
   * 머리를 여기에 두는 이유. loading.tsx는 layout 안쪽에 중첩되므로, 화면이 데이터를
   * 기다리는 동안에도 머리는 스켈레톤에 덮이지 않는다.
   */
  it("화면보다 먼저 머리를 그리고 본문을 안에 담는다", async () => {
    await renderLayout();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Patchwork" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("본문")).toBeInTheDocument();
  });

  it("세션 쿠키만으로 사용자 메뉴를 채운다 — GitHub에 묻지 않는다", async () => {
    await renderLayout();

    expect(screen.getByRole("link", { name: "The Octocat" })).toHaveAttribute(
      "href",
      "https://github.com/octocat",
    );
    expect(
      screen.getByRole("button", { name: "로그아웃" }),
    ).toBeInTheDocument();
  });

  /** 세션이 없으면 화면 쪽에서 홈으로 보낸다. 그 사이에 머리가 깨지지 않아야 한다. */
  it("세션이 없으면 사용자 메뉴 없이 머리만 그린다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await renderLayout();

    expect(screen.getByRole("link", { name: "Patchwork" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });
});
