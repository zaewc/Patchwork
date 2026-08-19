import { cookies, headers } from "next/headers";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout, { generateMetadata } from "@/_app/layout/ui/RootLayout";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

function request({ locale, theme }: { locale?: string; theme?: string } = {}) {
  const jar: Record<string, string | undefined> = {
    pw_locale: locale,
    pw_theme: theme,
  };
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (jar[name] ? { name, value: jar[name] } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  vi.mocked(headers).mockResolvedValue({
    get: () => null,
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

const markup = async () =>
  renderToStaticMarkup(
    await RootLayout({
      params: Promise.resolve({}),
      children: <p>본문</p>,
    }),
  );

beforeEach(() => {
  request();
});

describe("generateMetadata", () => {
  it("서비스 이름과 설명을 담는다", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Patchwork",
      description: "GitHub 기여 내역과 진행 중인 PR 상태를 추적합니다.",
    });
  });

  it("고른 언어로 설명을 적는다", async () => {
    request({ locale: "en" });
    await expect(generateMetadata()).resolves.toMatchObject({
      description:
        "Track your GitHub contributions and the pull requests still in flight.",
    });
  });
});

describe("RootLayout", () => {
  it("문서 언어를 요청의 언어로 선언한다", async () => {
    expect(await markup()).toContain('lang="ko"');

    request({ locale: "en" });
    expect(await markup()).toContain('lang="en"');
  });

  it("html을 화면 높이만큼 늘리고 글꼴을 부드럽게 렌더링한다", async () => {
    expect(await markup()).toContain('class="h-full antialiased"');
  });

  /**
   * 첫 그림부터 고른 색이어야 한다. 스크립트가 켜진 뒤 색을 고치면 그 사이에 반대 색이
   * 한 번 번쩍인다.
   */
  it("고른 테마를 첫 HTML에 실어 보낸다", async () => {
    request({ theme: "dark" });
    expect(await markup()).toContain('data-theme="dark"');

    request({ theme: "light" });
    expect(await markup()).toContain('data-theme="light"');
  });

  /** 속성이 없는 것 자체가 "운영체제를 따르라"는 뜻이다. */
  it("고르지 않았으면 아무것도 적지 않는다", async () => {
    expect(await markup()).not.toContain("data-theme");

    request({ theme: "system" });
    expect(await markup()).not.toContain("data-theme");
  });

  it("body를 화면 높이만큼 늘려 세로로 쌓는다", async () => {
    expect(await markup()).toContain('<body class="min-h-full flex flex-col">');
  });

  it("children을 body 안에 담는다", async () => {
    expect(await markup()).toContain("<p>본문</p>");
  });
});
