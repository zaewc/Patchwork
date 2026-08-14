import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pullRequest } from "@/_pages/dashboard/api/dashboard.fixtures";
import { MergedPullRequestList } from "@/_pages/dashboard/ui/merged-pull-request-list";

const NOW = Date.parse("2026-08-15T00:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MergedPullRequestList", () => {
  it("merge된 PR이 없으면 기본 안내를 보여준다", () => {
    render(<MergedPullRequestList pullRequests={[]} />);
    expect(screen.getByText("이 기간에 merge된 pull request가 없습니다.")).toBeInTheDocument();
  });

  it("안내 문구를 바꿀 수 있다", () => {
    render(<MergedPullRequestList pullRequests={[]} emptyMessage="전체로 전환해 보세요." />);
    expect(screen.getByText("전체로 전환해 보세요.")).toBeInTheDocument();
  });

  it("repository·번호·제목을 한 줄로 보여준다", () => {
    render(
      <MergedPullRequestList
        pullRequests={[
          pullRequest({ number: 9, title: "feat: 추가", mergedAt: "2026-08-14T00:00:00Z" }),
        ]}
      />,
    );

    const row = screen.getByRole("listitem");
    expect(within(row).getByRole("link")).toHaveTextContent("vercel/next.js #9 feat: 추가");
    expect(within(row).getByRole("link")).toHaveAttribute(
      "href",
      "https://github.com/vercel/next.js/pull/9",
    );
  });

  it("merge 시각을 상대 시간으로 보여준다", () => {
    render(<MergedPullRequestList pullRequests={[pullRequest({ mergedAt: "2026-08-10T00:00:00Z" })]} />);
    expect(screen.getByText("5일 전")).toBeInTheDocument();
  });

  it("merge 시각이 없으면 마지막 업데이트로 대신한다", () => {
    render(
      <MergedPullRequestList
        pullRequests={[pullRequest({ mergedAt: null, updatedAt: "2026-08-12T00:00:00Z" })]}
      />,
    );
    expect(screen.getByText("3일 전")).toBeInTheDocument();
  });

  it("여러 건을 준 순서대로 나열한다", () => {
    render(
      <MergedPullRequestList
        pullRequests={[
          pullRequest({ number: 1 }),
          pullRequest({ number: 2 }),
          pullRequest({ number: 3 }),
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
