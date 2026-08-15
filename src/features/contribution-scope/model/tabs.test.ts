import { describe, expect, it } from "vitest";
import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { scopeTabGroups } from "@/features/contribution-scope/model/tabs";
import { ROUTES } from "@/shared/config";

const groups = (params: ScopeParams = { range: "90d", showAll: false }) =>
  scopeTabGroups(params, ROUTES.dashboard);

describe("scopeTabGroups", () => {
  it("보기 범위와 기간을 두 줄로 나눈다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.map((tab) => tab.label)).toEqual(["주요 OSS", "전체"]);
    expect(ranges!.map((tab) => tab.label)).toEqual([
      "30일",
      "90일",
      "1년",
      "5년",
    ]);
  });

  it("탭마다 지금 조건에서 한 가지만 바꾼 주소를 단다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.map((tab) => tab.href)).toEqual([
      "/dashboard?range=90d",
      "/dashboard?range=90d&scope=all",
    ]);
    expect(ranges![3]!.href).toBe("/dashboard?range=5y");
  });

  it("눌러도 지금과 같은 조건인 탭이 선택된 탭이다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.map((tab) => tab.active)).toEqual([true, false]);
    expect(ranges!.map((tab) => tab.active)).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });

  it("자리에서 처리할 화면을 위해 바뀐 뒤의 조건을 함께 들려 보낸다", () => {
    const [scopes, ranges] = groups();

    expect(scopes![1]!.value).toEqual({ range: "90d", showAll: true });
    expect(ranges![0]!.value).toEqual({ range: "30d", showAll: false });
  });

  it("보기 범위를 켠 채로도 기간 탭이 그 상태를 유지한다", () => {
    const [, ranges] = groups({ range: "1y", showAll: true });

    expect(ranges![0]!.href).toBe("/dashboard?range=30d&scope=all");
    expect(ranges![0]!.value).toEqual({ range: "30d", showAll: true });
  });
});
