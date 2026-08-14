import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: ({ variable }: { variable: string }) => ({ variable }),
  Geist_Mono: ({ variable }: { variable: string }) => ({ variable }),
}));

const markup = () =>
  renderToStaticMarkup(
    RootLayout({ params: Promise.resolve({}), children: <p>본문</p> }) as React.ReactElement,
  );

describe("metadata", () => {
  it("서비스 이름과 설명을 담는다", () => {
    expect(metadata.title).toBe("Patchwork");
    expect(metadata.description).toBe("GitHub 기여 내역과 진행 중인 PR 상태를 추적합니다.");
  });
});

describe("RootLayout", () => {
  it("문서 언어를 한국어로 선언한다", () => {
    expect(markup()).toContain('lang="ko"');
  });

  it("본문 글꼴 변수를 html에 붙인다", () => {
    const html = markup();
    expect(html).toContain("--font-geist-sans");
    expect(html).toContain("--font-geist-mono");
    expect(html).toContain("antialiased");
  });

  it("body를 화면 높이만큼 늘려 세로로 쌓는다", () => {
    expect(markup()).toContain('<body class="min-h-full flex flex-col">');
  });

  it("children을 body 안에 담는다", () => {
    expect(markup()).toContain("<p>본문</p>");
  });
});
