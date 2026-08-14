import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MergedPullRequests, PullRequestBoard } from "@/components/pull-request-board";
import type { PullRequest } from "@/lib/github";

const NOW = Date.parse("2026-08-15T00:00:00Z");

const pr = (overrides: Partial<PullRequest> = {}): PullRequest => {
  const number = overrides.number ?? 1;
  return {
    number,
    title: `제목 ${number}`,
    url: `https://github.com/vercel/next.js/pull/${number}`,
    isDraft: false,
    updatedAt: "2026-08-14T00:00:00Z",
    mergedAt: null,
    reviewDecision: "REVIEW_REQUIRED",
    checkState: null,
    repo: "vercel/next.js",
    ownerAvatarUrl: "https://avatars.githubusercontent.com/vercel",
    isPrivate: false,
    impact: 96,
    isStale: false,
    ...overrides,
  };
};

const column = (title: string) => {
  const heading = screen.getByRole("heading", { name: new RegExp(`^${title}`) });
  return heading.closest("section")!;
};

const countOf = (title: string) =>
  Number(screen.getByRole("heading", { name: new RegExp(`^${title}`) }).textContent!.match(/\d+$/)![0]);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PullRequestBoard", () => {
  it("PR이 없으면 기본 안내를 보여준다", () => {
    render(<PullRequestBoard pullRequests={[]} />);
    expect(screen.getByText("열려 있는 pull request가 없습니다.")).toBeInTheDocument();
  });

  it("안내 문구를 바꿀 수 있다", () => {
    render(<PullRequestBoard pullRequests={[]} emptyMessage="모두 주요 OSS가 아닙니다." />);
    expect(screen.getByText("모두 주요 OSS가 아닙니다.")).toBeInTheDocument();
  });

  it("네 열을 항상 그린다", () => {
    render(<PullRequestBoard pullRequests={[pr()]} />);

    for (const title of ["Changes requested", "Review required", "Approved", "Draft"]) {
      expect(column(title)).toBeInTheDocument();
    }
  });

  it("비어 있는 열에는 없음이라고 적는다", () => {
    render(<PullRequestBoard pullRequests={[pr()]} />);

    expect(within(column("Draft")).getByText("없음")).toBeInTheDocument();
    expect(within(column("Review required")).queryByText("없음")).not.toBeInTheDocument();
  });

  describe("열 배치", () => {
    it.each([
      ["draft는 검토 상태보다 앞선다", { isDraft: true, reviewDecision: "CHANGES_REQUESTED" }, "Draft"],
      ["변경 요청", { reviewDecision: "CHANGES_REQUESTED" }, "Changes requested"],
      ["승인", { reviewDecision: "APPROVED" }, "Approved"],
      ["검토 대기", { reviewDecision: "REVIEW_REQUIRED" }, "Review required"],
      ["검토 상태 없음", { reviewDecision: null }, "Review required"],
    ] as const)("%s", (_label, overrides, expected) => {
      render(<PullRequestBoard pullRequests={[pr(overrides)]} />);

      expect(within(column(expected)).getByRole("listitem")).toBeInTheDocument();
      expect(countOf(expected)).toBe(1);
    });

    it("열마다 개수를 센다", () => {
      render(
        <PullRequestBoard
          pullRequests={[
            pr({ number: 1, reviewDecision: "APPROVED" }),
            pr({ number: 2, reviewDecision: "APPROVED" }),
            pr({ number: 3, isDraft: true }),
          ]}
        />,
      );

      expect(countOf("Approved")).toBe(2);
      expect(countOf("Draft")).toBe(1);
      expect(countOf("Changes requested")).toBe(0);
    });
  });

  describe("카드", () => {
    it("repository·번호·제목·링크를 담는다", () => {
      render(<PullRequestBoard pullRequests={[pr({ number: 42, title: "fix: 무언가" })]} />);

      const card = within(column("Review required")).getByRole("listitem");
      expect(within(card).getByText("vercel/next.js")).toBeInTheDocument();
      expect(within(card).getByRole("link")).toHaveAttribute(
        "href",
        "https://github.com/vercel/next.js/pull/42",
      );
      expect(within(card).getByRole("link")).toHaveTextContent("#42 fix: 무언가");
    });

    it("마지막 업데이트를 상대 시간으로 보여준다", () => {
      render(<PullRequestBoard pullRequests={[pr({ updatedAt: "2026-08-13T00:00:00Z" })]} />);
      expect(screen.getByText("2일 전")).toBeInTheDocument();
    });

    it("비공개 repository는 Private으로 표시한다", () => {
      render(<PullRequestBoard pullRequests={[pr({ isPrivate: true })]} />);
      expect(screen.getByText("Private")).toBeInTheDocument();
    });

    it("공개 repository에는 Private을 붙이지 않는다", () => {
      render(<PullRequestBoard pullRequests={[pr({ isPrivate: false })]} />);
      expect(screen.queryByText("Private")).not.toBeInTheDocument();
    });

    it("오래 조용한 PR은 Stale로 표시한다", () => {
      render(<PullRequestBoard pullRequests={[pr({ isStale: true })]} />);
      expect(screen.getByText("Stale")).toBeInTheDocument();
    });

    it.each([
      ["SUCCESS", "Checks passed", "text-ok"],
      ["FAILURE", "Checks failed", "text-danger"],
      ["ERROR", "Checks failed", "text-danger"],
      ["PENDING", "Checks pending", "text-warn"],
    ] as const)("체크 상태 %s 는 %s 로 보여준다", (checkState, text, tone) => {
      render(<PullRequestBoard pullRequests={[pr({ checkState })]} />);

      const label = screen.getByText(text);
      expect(label).toBeInTheDocument();
      expect(label.className).toContain(tone);
    });

    it.each([["EXPECTED"], [null]] as const)(
      "표시할 문구가 없는 체크 상태 %s 는 비워 둔다",
      (checkState) => {
        render(<PullRequestBoard pullRequests={[pr({ checkState })]} />);
        expect(screen.queryByText(/^Checks/)).not.toBeInTheDocument();
      },
    );
  });
});

describe("MergedPullRequests", () => {
  it("merge된 PR이 없으면 기본 안내를 보여준다", () => {
    render(<MergedPullRequests pullRequests={[]} />);
    expect(screen.getByText("이 기간에 merge된 pull request가 없습니다.")).toBeInTheDocument();
  });

  it("안내 문구를 바꿀 수 있다", () => {
    render(<MergedPullRequests pullRequests={[]} emptyMessage="전체로 전환해 보세요." />);
    expect(screen.getByText("전체로 전환해 보세요.")).toBeInTheDocument();
  });

  it("repository·번호·제목을 한 줄로 보여준다", () => {
    render(
      <MergedPullRequests
        pullRequests={[pr({ number: 9, title: "feat: 추가", mergedAt: "2026-08-14T00:00:00Z" })]}
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
    render(<MergedPullRequests pullRequests={[pr({ mergedAt: "2026-08-10T00:00:00Z" })]} />);
    expect(screen.getByText("5일 전")).toBeInTheDocument();
  });

  it("merge 시각이 없으면 마지막 업데이트로 대신한다", () => {
    render(
      <MergedPullRequests
        pullRequests={[pr({ mergedAt: null, updatedAt: "2026-08-12T00:00:00Z" })]}
      />,
    );
    expect(screen.getByText("3일 전")).toBeInTheDocument();
  });

  it("여러 건을 순서대로 나열한다", () => {
    render(
      <MergedPullRequests pullRequests={[pr({ number: 1 }), pr({ number: 2 }), pr({ number: 3 })]} />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
