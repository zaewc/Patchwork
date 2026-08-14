import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabBar } from "@/components/tab-bar";

describe("TabBar", () => {
  it("활성 탭에만 aria-current를 준다", () => {
    render(
      <TabBar
        items={[
          { href: "/a", label: "A", active: false },
          { href: "/b", label: "B", active: true },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "A" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("aria-current", "page");
  });
});
