import { describe, expect, it } from "vitest";
import { parseScopeParams, scopeHref } from "@/features/contribution-scope/model/params";
import { ROUTES } from "@/shared/config";

describe("parseScopeParams", () => {
  it("빈 쿼리스트링에는 기본값을 준다", () => {
    expect(parseScopeParams({})).toEqual({ range: "1y", showAll: false });
  });

  it("아는 range만 받아들인다", () => {
    expect(parseScopeParams({ range: "30d" }).range).toBe("30d");
    expect(parseScopeParams({ range: "5y" }).range).toBe("5y");
    expect(parseScopeParams({ range: "10y" }).range).toBe("1y");
    expect(parseScopeParams({ range: ["30d", "90d"] }).range).toBe("1y");
  });

  it("scope=all일 때만 전체 보기다", () => {
    expect(parseScopeParams({ scope: "all" }).showAll).toBe(true);
    expect(parseScopeParams({ scope: "notable" }).showAll).toBe(false);
    expect(parseScopeParams({ scope: ["all"] }).showAll).toBe(false);
  });
});

describe("scopeHref", () => {
  const current = { range: "90d", showAll: false } as const;

  it("현재 상태를 쿼리스트링으로 만든다", () => {
    expect(scopeHref(current, {}, ROUTES.dashboard)).toBe("/dashboard?range=90d");
  });

  it("전체 보기는 scope=all을 붙인다", () => {
    expect(scopeHref({ range: "1y", showAll: true }, {}, ROUTES.dashboard)).toBe(
      "/dashboard?range=1y&scope=all",
    );
  });

  it("override한 값만 갈아끼운다", () => {
    expect(scopeHref(current, { range: "5y" }, ROUTES.dashboard)).toBe("/dashboard?range=5y");
    expect(scopeHref(current, { showAll: true }, ROUTES.dashboard)).toBe(
      "/dashboard?range=90d&scope=all",
    );
  });

  it("경로를 바꿔도 상태는 유지된다", () => {
    expect(scopeHref(current, { showAll: true }, ROUTES.export)).toBe(
      "/export?range=90d&scope=all",
    );
  });
});
