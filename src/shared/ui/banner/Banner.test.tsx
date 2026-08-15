import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Banner } from "@/shared/ui/banner";

describe("Banner", () => {
  it("기본 톤은 warn이다", () => {
    render(<Banner>주의하세요</Banner>);
    const banner = screen.getByText("주의하세요");
    expect(banner.className).toContain("text-warn");
    expect(banner.className).not.toContain("text-danger");
  });

  it("danger 톤을 지정할 수 있다", () => {
    render(<Banner tone="danger">실패했습니다</Banner>);
    expect(screen.getByText("실패했습니다").className).toContain("text-danger");
  });

  it("바깥에서 준 className을 함께 적용한다", () => {
    render(<Banner className="mt-6 w-full">여백</Banner>);
    expect(screen.getByText("여백")).toHaveClass("mt-6", "w-full");
  });

  it("children을 그대로 담는다", () => {
    render(
      <Banner>
        앞 <strong>강조</strong> 뒤
      </Banner>,
    );
    expect(screen.getByRole("strong")).toHaveTextContent("강조");
  });
});
