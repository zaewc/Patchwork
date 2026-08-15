import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardLoading } from "@/_pages/dashboard/ui/DashboardLoading";
import { dictionaryOf } from "@/shared/lib/i18n-server";

const KO = dictionaryOf("ko");

describe("DashboardLoading", () => {
  it("사전이 있으면 헤더를 실제 화면과 같은 자리에 둔다", () => {
    render(<DashboardLoading dict={KO} />);
    expect(screen.getByRole("link", { name: "Patchwork" })).toBeInTheDocument();
  });

  it("불러오는 동안 사용자 메뉴는 비운다", () => {
    render(<DashboardLoading dict={KO} />);
    expect(
      screen.queryByRole("button", { name: "로그아웃" }),
    ).not.toBeInTheDocument();
  });

  /** 라우트의 loading.tsx는 요청을 읽지 않고 미리 그려 두므로 언어를 알 수 없다. */
  it("사전이 없으면 머리도 빈 자리로 남긴다", () => {
    render(<DashboardLoading />);
    expect(
      screen.queryByRole("link", { name: "Patchwork" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("제목·지표 4개·본문 2덩이 자리를 잡아 둔다", () => {
    const { container } = render(<DashboardLoading dict={KO} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
  });
});
