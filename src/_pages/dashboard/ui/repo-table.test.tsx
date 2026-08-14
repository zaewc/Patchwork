import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RepoTable } from "@/_pages/dashboard/ui/repo-table";
import type { RepoStat } from "@/entities/repo";

const repo = (overrides: Partial<RepoStat> = {}): RepoStat => ({
  nameWithOwner: "vercel/next.js",
  url: "https://github.com/vercel/next.js",
  ownerAvatarUrl: "https://avatars.githubusercontent.com/vercel",
  isPrivate: false,
  isExternal: true,
  impact: 96,
  commits: 10,
  pullRequests: 3,
  reviews: 2,
  issues: 1,
  total: 16,
  ...overrides,
});

const rowOf = (nameWithOwner: string) =>
  screen.getByRole("link", { name: nameWithOwner }).closest("tr")!;

const UNKNOWN_HINT = "기여 수 상위 목록에서 잘려 정확한 수를 알 수 없습니다.";
const PARTIAL_HINT = "일부 항목을 알 수 없어 실제보다 적을 수 있습니다.";

describe("RepoTable", () => {
  it("repository가 없으면 기본 안내를 보여준다", () => {
    render(<RepoTable repos={[]} />);
    expect(screen.getByText("이 기간에 기여한 repository가 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("안내 문구를 바꿀 수 있다", () => {
    render(<RepoTable repos={[]} emptyMessage="모두 주요 OSS가 아닙니다." />);
    expect(screen.getByText("모두 주요 OSS가 아닙니다.")).toBeInTheDocument();
  });

  it("열 제목을 순서대로 그린다", () => {
    render(<RepoTable repos={[repo()]} />);

    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      "Repository",
      "Commits",
      "Pull requests",
      "Reviews",
      "Issues",
      "Total",
    ]);
  });

  it("항목별 기여 수와 합계를 보여준다", () => {
    render(<RepoTable repos={[repo()]} />);

    const cells = within(rowOf("vercel/next.js")).getAllByRole("cell");
    expect(cells.map((td) => td.textContent)).toEqual(["vercel/next.js", "10", "3", "2", "1", "16"]);
  });

  it("합계는 천 단위로 끊는다", () => {
    render(<RepoTable repos={[repo({ total: 12345 })]} />);
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("repository 이름을 GitHub으로 잇고 권위 점수를 설명으로 붙인다", () => {
    render(<RepoTable repos={[repo({ impact: 84 })]} />);

    const link = screen.getByRole("link", { name: "vercel/next.js" });
    expect(link).toHaveAttribute("href", "https://github.com/vercel/next.js");
    expect(link).toHaveAttribute("title", "권위 점수 84/100");
  });

  it("owner avatar를 로고로 쓴다", () => {
    render(<RepoTable repos={[repo()]} />);
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://avatars.githubusercontent.com/vercel",
    );
  });

  it("비공개 repository는 Private으로 표시한다", () => {
    render(<RepoTable repos={[repo({ isPrivate: true })]} />);
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("공개 repository에는 Private을 붙이지 않는다", () => {
    render(<RepoTable repos={[repo()]} />);
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
  });

  it("여러 repository를 준 순서대로 나열한다", () => {
    render(
      <RepoTable
        repos={[
          repo({ nameWithOwner: "a/one" }),
          repo({ nameWithOwner: "b/two" }),
          repo({ nameWithOwner: "c/three" }),
        ]}
      />,
    );

    expect(screen.getAllByRole("row").slice(1).map((tr) => tr.textContent?.slice(0, 5))).toEqual([
      "a/one",
      "b/two",
      "c/thr",
    ]);
  });

  describe("알 수 없는 값", () => {
    it("null인 항목은 —로 두고 이유를 설명한다", () => {
      render(<RepoTable repos={[repo({ commits: null })]} />);

      const cells = within(rowOf("vercel/next.js")).getAllByRole("cell");
      expect(cells[1]).toHaveTextContent("—");
      expect(cells[1]).toHaveAttribute("title", UNKNOWN_HINT);
    });

    it("아는 항목에는 설명을 붙이지 않는다", () => {
      render(<RepoTable repos={[repo()]} />);

      const cells = within(rowOf("vercel/next.js")).getAllByRole("cell");
      expect(cells[1]).not.toHaveAttribute("title");
      expect(cells.at(-1)).not.toHaveAttribute("title");
    });

    it("모르는 항목이 하나라도 있으면 합계에 +를 붙인다", () => {
      render(<RepoTable repos={[repo({ reviews: null, total: 14 })]} />);

      const total = within(rowOf("vercel/next.js")).getAllByRole("cell").at(-1)!;
      expect(total).toHaveTextContent("14+");
      expect(total).toHaveAttribute("title", PARTIAL_HINT);
    });

    it("항목이 0이면 확정값으로 본다", () => {
      render(<RepoTable repos={[repo({ issues: 0 })]} />);

      const cells = within(rowOf("vercel/next.js")).getAllByRole("cell");
      expect(cells[4]).toHaveTextContent("0");
      expect(cells.at(-1)).not.toHaveAttribute("title");
    });
  });
});
