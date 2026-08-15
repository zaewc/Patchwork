import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScopeParams } from "@/features/contribution-scope/model/use-scope-params";
import { ROUTES } from "@/shared/config";

const INITIAL = { range: "1y", showAll: false } as const;

const setUp = () => renderHook(() => useScopeParams(INITIAL, ROUTES.dashboard));

beforeEach(() => {
  window.history.replaceState(null, "", ROUTES.dashboard);
});

describe("useScopeParams", () => {
  it("서버가 정해 준 조건에서 시작한다", () => {
    const { result } = setUp();
    expect(result.current[0]).toEqual(INITIAL);
  });

  it("조건을 바꾸면 서버를 다시 다녀오지 않고 주소만 갈아끼운다", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { result } = setUp();

    act(() => result.current[1]({ range: "90d", showAll: true }));

    expect(pushState).toHaveBeenCalledExactlyOnceWith(
      null,
      "",
      "/dashboard?range=90d&scope=all",
    );
    expect(result.current[0]).toEqual({ range: "90d", showAll: true });
  });

  it("뒤로 가기를 하면 주소에 적힌 조건으로 돌아온다", () => {
    const { result } = setUp();
    act(() => result.current[1]({ range: "5y", showAll: false }));

    window.history.replaceState(null, "", "/dashboard?range=30d&scope=all");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toEqual({ range: "30d", showAll: true });
  });

  it("화면을 떠나면 뒤로 가기를 더 듣지 않는다", () => {
    const remove = vi.spyOn(window, "removeEventListener");

    setUp().unmount();

    expect(remove).toHaveBeenCalledWith("popstate", expect.any(Function));
  });
});
