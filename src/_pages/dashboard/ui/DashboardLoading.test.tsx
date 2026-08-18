import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";

const section = (title: string) =>
  screen.getByRole("heading", { name: title }).closest("section")!;

describe("DashboardLoading", () => {
  /** 머리는 DashboardLayout이 세션만으로 이미 그려 두었으므로 스켈레톤이 덮지 않는다. */
  it("머리에는 손대지 않는다", () => {
    render(<DashboardLoading />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  /** 언어와 무관한 골격 라벨은 데이터가 없어도 아는 것이므로 회색으로 가리지 않는다. */
  it("구역 제목 넷을 회색으로 덮지 않고 그대로 적는다", () => {
    render(<DashboardLoading />);

    for (const title of [
      "Contributions",
      "Repositories",
      "Open pull requests",
      "Recently merged",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("제목 줄에 탭과 새로고침 버튼 자리까지 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    expect(
      container.querySelectorAll(
        ":scope > main > div:first-child .animate-pulse",
      ),
    ).toHaveLength(4);
  });

  it("지표 카드 넷 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.querySelectorAll(".lg\\:grid-cols-4 > div")).toHaveLength(
      4,
    );
  });

  /** 실제 화면의 네 구역이 모두 자리를 잡아야 도착하는 순간 화면이 튀지 않는다. */
  it("구역 넷 모두 안쪽에 자리를 잡아 둔다", () => {
    render(<DashboardLoading />);

    for (const title of [
      "Contributions",
      "Repositories",
      "Open pull requests",
      "Recently merged",
    ]) {
      expect(
        section(title).querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
    }
  });
});
