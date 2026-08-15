import { cookies, headers } from "next/headers";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootLayout, { generateMetadata } from "@/_app/layout/ui/RootLayout";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

function locale(value?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "pw_locale" && value ? { name, value } : undefined,
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
  locale();
});

describe("generateMetadata", () => {
  it("서비스 이름과 설명을 담는다", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "Patchwork",
      description: "GitHub 기여 내역과 진행 중인 PR 상태를 추적합니다.",
    });
  });

  it("고른 언어로 설명을 적는다", async () => {
    locale("en");
    await expect(generateMetadata()).resolves.toMatchObject({
      description:
        "Track your GitHub contributions and the pull requests still in flight.",
    });
  });
});

describe("RootLayout", () => {
  it("문서 언어를 요청의 언어로 선언한다", async () => {
    expect(await markup()).toContain('lang="ko"');

    locale("en");
    expect(await markup()).toContain('lang="en"');
  });

  it("html을 화면 높이만큼 늘리고 글꼴을 부드럽게 렌더링한다", async () => {
    expect(await markup()).toContain(
      '<html lang="ko" class="h-full antialiased">',
    );
  });

  it("body를 화면 높이만큼 늘려 세로로 쌓는다", async () => {
    expect(await markup()).toContain('<body class="min-h-full flex flex-col">');
  });

  it("children을 body 안에 담는다", async () => {
    expect(await markup()).toContain("<p>본문</p>");
  });
});
