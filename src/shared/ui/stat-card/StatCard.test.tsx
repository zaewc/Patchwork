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
});
