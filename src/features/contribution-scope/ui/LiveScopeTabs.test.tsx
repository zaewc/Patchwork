import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { LiveScopeTabs } from "@/features/contribution-scope/ui/LiveScopeTabs";
import { ROUTES } from "@/shared/config";
import { dictionaryOf } from "@/shared/lib/i18n-server";

/** 고른 조건이 그대로 다시 내려오는, 실제 화면과 같은 흐름을 만든다. */
function Harness() {
  const [params, setParams] = useState<ScopeParams>({
    range: "1y",
    showAll: false,
  });

  return (
    <LiveScopeTabs
      params={params}
      path={ROUTES.dashboard}
      dict={dictionaryOf("ko")}
      inPlace={{ select: setParams, prefetch: vi.fn() }}
    />
  );
}

describe("LiveScopeTabs", () => {
  it("조건을 여러 번 바꿔도 탭 묶음은 두 줄 그대로다", () => {
    const { container } = render(<Harness />);

    // 30일은 두 줄의 첫 주소가 겹치던 조건이라 특히 확인한다.
    fireEvent.click(screen.getByRole("link", { name: "30일" }));
    fireEvent.click(screen.getByRole("link", { name: "전체" }));
    fireEvent.click(screen.getByRole("link", { name: "1년" }));

    expect(container.querySelectorAll("nav")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "전체" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "1년" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
