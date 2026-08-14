import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "@/_app/layout/ui/root-layout";

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

  it("html을 화면 높이만큼 늘리고 글꼴을 부드럽게 렌더링한다", () => {
    expect(markup()).toContain('<html lang="ko" class="h-full antialiased">');
  });

  it("body를 화면 높이만큼 늘려 세로로 쌓는다", () => {
    expect(markup()).toContain('<body class="min-h-full flex flex-col">');
  });

  it("children을 body 안에 담는다", () => {
    expect(markup()).toContain("<p>본문</p>");
  });
});
