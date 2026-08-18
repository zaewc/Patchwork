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

  it("accent를 주면 강조 배경을 쓴다", () => {
    const { container } = render(
      <StatCard label="주요 OSS 기여" value={7} numberLocale="ko-KR" accent />,
    );
    expect(container.firstElementChild?.className).toContain("bg-accent-soft");
  });

  it("기본은 강조하지 않는다", () => {
    const { container } = render(
      <StatCard label="합계" value={7} numberLocale="ko-KR" />,
    );
    expect(container.firstElementChild?.className).toContain("bg-surface");
    expect(container.firstElementChild?.className).not.toContain(
      "bg-accent-soft",
    );
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
