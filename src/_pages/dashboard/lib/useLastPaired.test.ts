import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLastPaired } from "@/_pages/dashboard/lib/useLastPaired";

const setup = (paired: string | null) =>
  renderHook(({ value }: { value: string | null }) => useLastPaired(value), {
    initialProps: { value: paired },
  });

describe("useLastPaired", () => {
  it("짝이 맞는 값은 그대로 내놓는다", () => {
    expect(setup("1년").result.current).toBe("1년");
  });

  it("처음부터 짝이 없으면 아무것도 없다", () => {
    expect(setup(null).result.current).toBeNull();
  });

  /** 새 기간의 점수표를 기다리는 동안 스켈레톤으로 되돌아가지 않게 하는 것이 이 훅의 일이다. */
  it("짝이 어긋난 사이에는 직전 값을 붙들고 있는다", () => {
    const { result, rerender } = setup("1년");

    rerender({ value: null });

    expect(result.current).toBe("1년");
  });

  it("새 짝이 도착하면 그것으로 바꾼다", () => {
    const { result, rerender } = setup("1년");

    rerender({ value: null });
    rerender({ value: "30일" });

    expect(result.current).toBe("30일");
  });
});
