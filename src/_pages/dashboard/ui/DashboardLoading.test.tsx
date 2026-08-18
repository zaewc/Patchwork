import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";

describe("DashboardLoading", () => {
  /** 머리는 DashboardLayout이 세션만으로 이미 그려 두었으므로 스켈레톤이 덮지 않는다. */
  it("머리에는 손대지 않는다", () => {
    render(<DashboardLoading />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("제목·지표 4개·본문 2덩이 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
  });
});
