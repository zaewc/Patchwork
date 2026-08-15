import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "@/shared/ui/tab-bar";

const items = [
  { href: "/a", label: "A", active: false, value: "a" },
  { href: "/b", label: "B", active: true, value: "b" },
];

describe("TabBar", () => {
  it("활성 탭에만 aria-current를 준다", () => {
    render(<TabBar items={items} />);

    expect(screen.getByRole("link", { name: "A" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("자리에서 처리하는 탭은 주소를 남긴 채 이동만 막는다", () => {
    const inPlace = { select: vi.fn(), prefetch: vi.fn() };
    render(<TabBar items={items} inPlace={inPlace} />);

    const tab = screen.getByRole("link", { name: "A" });
    expect(tab).toHaveAttribute("href", "/a");
    expect(fireEvent.click(tab)).toBe(false);
    expect(inPlace.select).toHaveBeenCalledExactlyOnceWith("a");
  });

  it("포인터가 닿으면 누르기 전에 미리 준비할 기회를 준다", async () => {
    const inPlace = { select: vi.fn(), prefetch: vi.fn() };
    render(<TabBar items={items} inPlace={inPlace} />);

    await userEvent.hover(screen.getByRole("link", { name: "B" }));

    expect(inPlace.prefetch).toHaveBeenCalledExactlyOnceWith("b");
    expect(inPlace.select).not.toHaveBeenCalled();
  });
});
