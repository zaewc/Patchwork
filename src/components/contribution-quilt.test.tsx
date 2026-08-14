import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContributionQuilt } from "@/components/contribution-quilt";
import type { CalendarDay } from "@/lib/github";

const DAY_MS = 86_400_000;

const day = (date: string, count: number): CalendarDay => ({
  date,
  count,
  weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
});

/** 일요일에 새 주를 시작하는 방식으로 달력을 만든다 (mergeCalendars와 같은 규칙). */
function weeksFrom(startDate: string, counts: number[]): CalendarDay[][] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const weeks: CalendarDay[][] = [];

  counts.forEach((count, offset) => {
    const date = new Date(start + offset * DAY_MS).toISOString().slice(0, 10);
    const entry = day(date, count);
    if (weeks.length === 0 || entry.weekday === 0) weeks.push([]);
    weeks[weeks.length - 1].push(entry);
  });

  return weeks;
}

const zeros = (length: number) => Array.from({ length }, () => 0);

const cellOf = (date: string, count: number) =>
  screen.getByTitle(`${date} · ${count} contributions`);

const levelOf = (element: HTMLElement) =>
  Number(element.className.match(/patch-(\d)/)![1]);

describe("ContributionQuilt", () => {
  it("달력이 비어 있어도 범례는 그린다", () => {
    const { container } = render(<ContributionQuilt weeks={[]} />);

    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(container.querySelectorAll("[title]")).toHaveLength(0);
    // 범례 칸 5개
    expect(container.querySelectorAll(".quilt-cell")).toHaveLength(5);
  });

  it("기여가 하나도 없으면 모든 칸이 0단계다", () => {
    render(<ContributionQuilt weeks={weeksFrom("2026-08-09", [0, 0, 0])} />);

    for (const date of ["2026-08-09", "2026-08-10", "2026-08-11"]) {
      expect(levelOf(cellOf(date, 0))).toBe(0);
    }
  });

  it("기여 수를 사분위로 나눠 1~4단계를 준다", () => {
    render(<ContributionQuilt weeks={weeksFrom("2026-08-09", [0, 1, 2, 3, 4, 5])} />);

    expect(levelOf(cellOf("2026-08-09", 0))).toBe(0);
    expect(levelOf(cellOf("2026-08-10", 1))).toBe(1);
    expect(levelOf(cellOf("2026-08-11", 2))).toBe(1);
    expect(levelOf(cellOf("2026-08-12", 3))).toBe(2);
    expect(levelOf(cellOf("2026-08-13", 4))).toBe(3);
    expect(levelOf(cellOf("2026-08-14", 5))).toBe(4);
  });

  it("단계는 기여 수에 따라 단조 증가한다", () => {
    const counts = [1, 4, 9, 16, 25, 36, 49, 64];
    render(<ContributionQuilt weeks={weeksFrom("2026-08-09", counts)} />);

    const levels = counts.map((count, offset) =>
      levelOf(cellOf(new Date(Date.parse("2026-08-09T00:00:00Z") + offset * DAY_MS).toISOString().slice(0, 10), count)),
    );

    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(levels.at(0)).toBe(1);
    expect(levels.at(-1)).toBe(4);
  });

  it("날짜와 기여 수를 칸의 설명으로 붙인다", () => {
    render(<ContributionQuilt weeks={weeksFrom("2026-08-09", [7])} />);
    expect(cellOf("2026-08-09", 7)).toBeInTheDocument();
  });

  it("월·수·금에만 요일 이름을 붙인다", () => {
    render(<ContributionQuilt weeks={weeksFrom("2026-08-09", [1])} />);

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.queryByText("Sun")).not.toBeInTheDocument();
    expect(screen.queryByText("Tue")).not.toBeInTheDocument();
  });

  it("주에서 빠진 요일은 빈 칸으로 자리만 채운다", () => {
    // 수요일 하루만 있는 주 → 칸 7개 중 1개만 설명이 붙는다.
    const { container } = render(<ContributionQuilt weeks={[[day("2026-08-12", 3)]]} />);

    expect(container.querySelectorAll("[title]")).toHaveLength(1);
    // 격자 7칸 + 범례 5칸
    expect(container.querySelectorAll(".quilt-cell")).toHaveLength(12);
  });

  it("아무 날도 없는 주는 월 이름을 만들지 않는다", () => {
    render(<ContributionQuilt weeks={[[], [day("2026-08-09", 1)]]} />);
    expect(screen.queryByText("Aug")).not.toBeInTheDocument();
  });

  describe("기간이 짧을 때", () => {
    it("12px 칸을 쓴다", () => {
      const { container } = render(<ContributionQuilt weeks={weeksFrom("2026-08-09", [1])} />);

      expect(container.querySelectorAll(".quilt-cell-dense")).toHaveLength(0);
      expect(container.querySelector('[style*="grid-template-rows"]')).toHaveAttribute(
        "style",
        expect.stringContaining("repeat(7, 12px)"),
      );
    });

    it("달이 바뀔 때마다 월 이름을 찍는다", () => {
      render(<ContributionQuilt weeks={weeksFrom("2026-06-07", zeros(84))} />);

      expect(screen.getByText("Jun")).toBeInTheDocument();
      expect(screen.getByText("Jul")).toBeInTheDocument();
      expect(screen.getByText("Aug")).toBeInTheDocument();
    });

    it("같은 달이 이어지는 주에는 이름을 반복하지 않는다", () => {
      render(<ContributionQuilt weeks={weeksFrom("2026-08-02", zeros(28))} />);
      expect(screen.getAllByText("Aug")).toHaveLength(1);
    });

    it("마지막 주에는 월 이름을 찍지 않는다", () => {
      // 9월은 마지막 주에서 처음 나타나므로 라벨이 없다.
      render(<ContributionQuilt weeks={weeksFrom("2026-08-09", zeros(29))} />);

      expect(screen.getByText("Aug")).toBeInTheDocument();
      expect(screen.queryByText("Sep")).not.toBeInTheDocument();
    });
  });

  describe("기간이 길 때", () => {
    const longWeeks = weeksFrom("2025-06-01", zeros(70 * 7));

    it("60주를 넘으면 8px 칸으로 줄인다", () => {
      const { container } = render(<ContributionQuilt weeks={longWeeks} />);

      expect(longWeeks.length).toBeGreaterThan(60);
      expect(container.querySelectorAll(".quilt-cell")).toHaveLength(0);
      expect(container.querySelector('[style*="grid-template-rows"]')).toHaveAttribute(
        "style",
        expect.stringContaining("repeat(7, 8px)"),
      );
    });

    it("월 이름 대신 연 경계에만 연도를 찍는다", () => {
      render(<ContributionQuilt weeks={longWeeks} />);

      expect(screen.getByText("2026")).toBeInTheDocument();
      for (const month of ["Jun", "Jul", "Aug", "Jan"]) {
        expect(screen.queryByText(month)).not.toBeInTheDocument();
      }
    });
  });
});
