import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCard } from "@/shared/ui/stat-card";

describe("StatCard", () => {
  it("이름과 천 단위로 끊은 값을 보여준다", () => {
    render(
      <StatCard label="Contributions" value={12345} numberLocale="ko-KR" />,
    );
    expect(screen.getByText("Contributions")).toBeInTheDocument();
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("자릿점은 주어진 언어의 규칙을 따른다", () => {
    render(
      <StatCard label="Contributions" value={12345} numberLocale="de-DE" />,
    );
    expect(screen.getByText("12.345")).toBeInTheDocument();
  });

  it("hint가 있으면 함께 보여준다", () => {
    render(
      <StatCard
        label="Open pull requests"
        value={3}
        numberLocale="ko-KR"
        hint="Stale 1건"
      />,
    );
    expect(screen.getByText("Stale 1건")).toBeInTheDocument();
  });

  it("hint가 없으면 아무것도 덧붙이지 않는다", () => {
    const { container } = render(
      <StatCard label="합계" value={0} numberLocale="ko-KR" />,
    );
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("accent를 주면 왼쪽 선으로만 강조한다", () => {
    const { container } = render(
      <StatCard label="주요 OSS 기여" value={7} numberLocale="ko-KR" accent />,
    );
    const card = container.firstElementChild?.className ?? "";

    expect(card).toContain("border-l-accent");
    expect(card).not.toContain("bg-accent-soft");
  });

  it("기본은 강조하지 않는다", () => {
    const { container } = render(
      <StatCard label="합계" value={7} numberLocale="ko-KR" />,
    );
    const card = container.firstElementChild?.className ?? "";

    expect(card).toContain("bg-surface");
    expect(card).not.toContain("border-l-accent");
  });

  /** 큰 글자에서는 모든 숫자가 `0` 너비를 차지해 성기게 벌어져 보인다. */
  it("큰 숫자에는 자릿수를 맞추지 않는다", () => {
    render(<StatCard label="합계" value={121} numberLocale="ko-KR" />);
    expect(screen.getByText("121")).not.toHaveClass("tabular-nums");
  });

  /** 색을 가려 보는 사람에게 색 하나만으로는 아무 말도 하지 않는 것과 같다. */
  it("살펴봐야 할 덧말은 색과 그림을 함께 입는다", () => {
    render(
      <StatCard
        label="Open pull requests"
        value={6}
        numberLocale="ko-KR"
        hint="Stale 5건"
        hintTone="warn"
      />,
    );
    const hint = screen.getByText("Stale 5건");

    expect(hint).toHaveClass("text-warn");
    expect(hint.querySelector("svg")).toBeInTheDocument();
  });

  it("보통 덧말은 조용하게 둔다", () => {
    render(
      <StatCard
        label="합계"
        value={6}
        numberLocale="ko-KR"
        hint="Merged 1건"
      />,
    );
    const hint = screen.getByText("Merged 1건");

    expect(hint).toHaveClass("text-muted");
    expect(hint.querySelector("svg")).not.toBeInTheDocument();
  });

  /** 여럿을 한 줄에 세우는 카드라, 값이 늦게 오는 것 때문에 줄 높이가 바뀌면 안 된다. */
  it("값이 아직 없으면 이름은 두고 숫자와 덧말 자리만 비운다", () => {
    const { container } = render(
      <StatCard
        label="주요 OSS 기여"
        value={null}
        numberLocale="ko-KR"
        hint="이 덧말은 아직 셀 수 없다"
      />,
    );

    expect(screen.getByText("주요 OSS 기여")).toBeInTheDocument();
    expect(
      screen.queryByText("이 덧말은 아직 셀 수 없다"),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
  });
});
