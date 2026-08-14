import { describe, expect, it } from "vitest";
import type { ContributionGroup } from "@/entities/contribution";
import { toMarkdown } from "@/_pages/readme-export/lib/to-markdown";

const group = (overrides: Partial<ContributionGroup> = {}): ContributionGroup => ({
  name: "next.js",
  nameWithOwner: "vercel/next.js",
  url: "https://github.com/vercel/next.js",
  impact: 100,
  items: [
    {
      type: "PR",
      title: "fix: hydration mismatch",
      url: "https://github.com/vercel/next.js/pull/1",
      createdAt: "2026-03-04T09:00:00Z",
    },
  ],
  ...overrides,
});

describe("toMarkdown", () => {
  it("repository별 제목과 항목 줄을 만든다", () => {
    expect(toMarkdown([group()])).toBe(
      "### next.js\n\n- `26-03-04` **PR** | [fix: hydration mismatch](https://github.com/vercel/next.js/pull/1)",
    );
  });

  it("항목 종류를 그대로 표시한다", () => {
    const markdown = toMarkdown([
      group({
        items: [
          { type: "PR", title: "PR 제목", url: "https://x/pull/1", createdAt: "2026-01-02" },
          { type: "Issue", title: "Issue 제목", url: "https://x/issues/2", createdAt: "2026-01-03" },
        ],
      }),
    ]);

    expect(markdown).toContain("**PR** | [PR 제목](https://x/pull/1)");
    expect(markdown).toContain("**Issue** | [Issue 제목](https://x/issues/2)");
  });

  it("group 사이를 빈 줄로 나눈다", () => {
    const markdown = toMarkdown([group(), group({ name: "vite" })]);
    expect(markdown).toBe(
      [
        "### next.js",
        "",
        "- `26-03-04` **PR** | [fix: hydration mismatch](https://github.com/vercel/next.js/pull/1)",
        "",
        "### vite",
        "",
        "- `26-03-04` **PR** | [fix: hydration mismatch](https://github.com/vercel/next.js/pull/1)",
      ].join("\n"),
    );
  });

  it("제목의 대괄호를 이스케이프해 링크가 깨지지 않게 한다", () => {
    const markdown = toMarkdown([
      group({
        items: [
          {
            type: "PR",
            title: "[docs] fix [broken] link",
            url: "https://x/pull/3",
            createdAt: "2026-01-02",
          },
        ],
      }),
    ]);

    expect(markdown).toContain("[\\[docs\\] fix \\[broken\\] link](https://x/pull/3)");
  });

  it("항목이 없는 group은 제목만 남는다", () => {
    expect(toMarkdown([group({ items: [] })])).toBe("### next.js\n");
  });

  it("group이 없으면 빈 문자열이다", () => {
    expect(toMarkdown([])).toBe("");
  });
});
