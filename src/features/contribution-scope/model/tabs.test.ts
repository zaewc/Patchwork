import { describe, expect, it } from "vitest";
import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { scopeTabGroups } from "@/features/contribution-scope/model/tabs";
import { RANGES, ROUTES, type RangeKey } from "@/shared/config";
import { dictionaryOf } from "@/shared/lib/i18n-server";

const KO = dictionaryOf("ko");

const groups = (params: ScopeParams = { range: "90d", showAll: false }) =>
  scopeTabGroups(params, ROUTES.dashboard, KO);

describe("scopeTabGroups", () => {
  it("보기 범위와 기간을 두 줄로 나눈다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.items.map((tab) => tab.label)).toEqual(["주요 OSS", "전체"]);
    expect(ranges!.items.map((tab) => tab.label)).toEqual([
      "30일",
      "90일",
      "1년",
      "5년",
    ]);
  });

  it("라벨은 사전에서 온다", () => {
    const [scopes, ranges] = scopeTabGroups(
      { range: "90d", showAll: false },
      ROUTES.dashboard,
      dictionaryOf("en"),
    );

    expect(scopes!.items.map((tab) => tab.label)).toEqual([
      "Notable OSS",
      "All",
    ]);
    expect(ranges!.items.map((tab) => tab.label)).toEqual([
      "30 days",
      "90 days",
      "1 year",
      "5 years",
    ]);
  });

  it("탭마다 지금 조건에서 한 가지만 바꾼 주소를 단다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.items.map((tab) => tab.href)).toEqual([
      "/dashboard?range=90d",
      "/dashboard?range=90d&scope=all",
    ]);
    expect(ranges!.items[3]!.href).toBe("/dashboard?range=5y");
  });

  it("눌러도 지금과 같은 조건인 탭이 선택된 탭이다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.items.map((tab) => tab.active)).toEqual([true, false]);
    expect(ranges!.items.map((tab) => tab.active)).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });

  it("자리에서 처리할 화면을 위해 바뀐 뒤의 조건을 함께 들려 보낸다", () => {
    const [scopes, ranges] = groups();

    expect(scopes!.items[1]!.value).toEqual({ range: "90d", showAll: true });
    expect(ranges!.items[0]!.value).toEqual({ range: "30d", showAll: false });
  });

  it("보기 범위를 켠 채로도 기간 탭이 그 상태를 유지한다", () => {
    const [, ranges] = groups({ range: "1y", showAll: true });

    expect(ranges!.items[0]!.href).toBe("/dashboard?range=30d&scope=all");
    expect(ranges!.items[0]!.value).toEqual({ range: "30d", showAll: true });
  });

  /**
   * id가 주소에서 나오면 range=30d일 때 두 줄의 첫 주소가 겹친다.
   * React가 같은 key를 가진 형제로 보고 서로를 지운다.
   */
  it("어떤 조건에서도 두 줄의 id는 서로 다르고 변하지 않는다", () => {
    for (const range of Object.keys(RANGES) as RangeKey[]) {
      for (const showAll of [false, true]) {
        expect(groups({ range, showAll }).map((group) => group.id)).toEqual([
          "scope",
          "range",
        ]);
      }
    }
  });
});
