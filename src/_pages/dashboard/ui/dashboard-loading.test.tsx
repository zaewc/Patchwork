import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoading } from "@/_pages/dashboard/ui/dashboard-loading";

describe("DashboardLoading", () => {
  it("헤더는 실제 화면과 같은 자리에 둔다", () => {
    render(<DashboardLoading />);
    expect(screen.getByRole("link", { name: "Patchwork" })).toBeInTheDocument();
  });

  it("불러오는 동안 사용자 메뉴는 비운다", () => {
    render(<DashboardLoading />);
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("제목·지표 4개·본문 2덩이 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
  });
});
