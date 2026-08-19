import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";

const SECTIONS = ["Repositories", "Open pull requests", "Recently merged"];

const section = (title: string) =>
  screen.getByRole("heading", { name: title }).closest("section")!;

describe("DashboardLoading", () => {
  /** 머리는 DashboardLayout이 세션만으로 이미 그려 두었으므로 스켈레톤이 덮지 않는다. */
  it("머리에는 손대지 않는다", () => {
    render(<DashboardLoading />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  /** 언어와 무관한 골격 라벨은 데이터가 없어도 아는 것이므로 회색으로 가리지 않는다. */
  it("구역 제목 셋을 회색으로 덮지 않고 그대로 적는다", () => {
    render(<DashboardLoading />);

    for (const title of SECTIONS) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  /** 화면이 시작하는 판. 신원·이끄는 수·퀼트가 여기 모인다. */
  it("첫 판의 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    const hero = container.querySelector("main > section")!;

    expect(hero).toBeInTheDocument();
    expect(hero.querySelectorAll(".animate-pulse").length).toBeGreaterThan(5);
    // 동그란 avatar 자리와 큰 숫자 자리
    expect(hero.querySelector(".rounded-full")).toBeInTheDocument();
  });

  it("지표 카드 셋 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.querySelectorAll(".sm\\:grid-cols-3 > div")).toHaveLength(
      3,
    );
  });

  /** 실제 화면의 구역이 모두 자리를 잡아야 도착하는 순간 화면이 튀지 않는다. */
  it("구역 셋 모두 안쪽에 자리를 잡아 둔다", () => {
    render(<DashboardLoading />);

    for (const title of SECTIONS) {
      expect(
        section(title).querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    }
  });
});
