import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "@/_pages/home/ui/HomePage";
import { getSession } from "@/entities/viewer";
import { isOAuthConfigured } from "@/shared/config";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/entities/viewer", () => ({ getSession: vi.fn() }));
vi.mock("@/shared/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/config")>()),
  isOAuthConfigured: vi.fn(),
}));

/** 실제 redirect()처럼 흐름을 끊는다. */
class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}

const props = (
  searchParams: Record<string, string | string[] | undefined> = {},
): PageProps<"/"> => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(searchParams),
});

const renderPage = async (
  searchParams?: Record<string, string | string[] | undefined>,
) => render(await HomePage(props(searchParams)));

beforeEach(() => {
  vi.mocked(redirect).mockReset();
  vi.mocked(redirect).mockImplementation((url: string) => {
    throw new RedirectSignal(url);
  });
  vi.mocked(getSession).mockResolvedValue(null);
  vi.mocked(isOAuthConfigured).mockReturnValue(true);
});

describe("HomePage", () => {
  it("이미 로그인했으면 대시보드로 보낸다", async () => {
    vi.mocked(getSession).mockResolvedValue({
      token: "t",
      login: "octocat",
      name: null,
      avatarUrl: "a",
    });

    await expect(HomePage(props())).rejects.toBeInstanceOf(RedirectSignal);
    expect(redirect).toHaveBeenCalledExactlyOnceWith("/dashboard");
  });

  it("서비스 소개를 보여준다", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "오픈소스 기여를 한 장의 Patchwork로",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "GitHub contribution과 진행 중인 pull request 상태를 추적합니다.",
      ),
    ).toBeInTheDocument();
  });

  it("로그인 전에는 헤더에 사용자 메뉴가 없다", async () => {
    await renderPage();
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });

  describe("OAuth 앱이 설정된 경우", () => {
    it("GitHub 로그인 버튼을 보여준다", async () => {
      await renderPage();

      expect(
        screen.getByRole("link", { name: "Sign in with GitHub" }),
      ).toHaveAttribute("href", "/api/auth/login");
    });

    it("설정 안내는 감춘다", async () => {
      await renderPage();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("OAuth 앱이 설정되지 않은 경우", () => {
    beforeEach(() => {
      vi.mocked(isOAuthConfigured).mockReturnValue(false);
    });

    it("로그인 버튼 대신 설정 방법을 안내한다", async () => {
      await renderPage();

      expect(
        screen.queryByRole("link", { name: "Sign in with GitHub" }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("콜백 URL과 환경변수 파일 이름을 알려준다", async () => {
      await renderPage();

      expect(
        screen.getByText("http://localhost:3000/api/auth/callback"),
      ).toBeInTheDocument();
      expect(screen.getByText(".env.local")).toBeInTheDocument();
    });
  });

  describe("로그인 실패 안내", () => {
    it.each([
      ["not_configured", "GitHub OAuth 환경변수가 설정되지 않았습니다."],
      ["access_denied", "GitHub 로그인이 취소되었습니다."],
      ["invalid_state", "로그인 요청이 만료되었습니다. 다시 시도해 주세요."],
      [
        "token_exchange_failed",
        "토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
      ],
      ["identity_failed", "GitHub 사용자 정보를 가져오지 못했습니다."],
    ])("error=%s 에는 사유를 설명한다", async (error, message) => {
      await renderPage({ error });
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it("모르는 사유는 일반 문구로 안내한다", async () => {
      await renderPage({ error: "bad_verification_code" });
      expect(
        screen.getByText("로그인 중 문제가 발생했습니다."),
      ).toBeInTheDocument();
    });

    it("error가 없으면 안내를 띄우지 않는다", async () => {
      await renderPage();
      expect(screen.queryByText(/문제가 발생했습니다/)).not.toBeInTheDocument();
    });

    it("error가 여러 번 붙어 오면 무시한다", async () => {
      await renderPage({ error: ["access_denied", "invalid_state"] });
      expect(screen.queryByText(/취소되었습니다/)).not.toBeInTheDocument();
    });
  });
});
