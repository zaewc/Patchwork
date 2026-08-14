import { describe, expect, it } from "vitest";
import { dashboardHref, parseDashboardParams } from "@/lib/dashboard-params";

describe("parseDashboardParams", () => {
  it("빈 쿼리스트링에는 기본값을 준다", () => {
    expect(parseDashboardParams({})).toEqual({ range: "1y", showAll: false });
  });

  it("아는 range만 받아들인다", () => {
    expect(parseDashboardParams({ range: "30d" }).range).toBe("30d");
    expect(parseDashboardParams({ range: "5y" }).range).toBe("5y");
    expect(parseDashboardParams({ range: "10y" }).range).toBe("1y");
    expect(parseDashboardParams({ range: ["30d", "90d"] }).range).toBe("1y");
  });

  it("scope=all일 때만 전체 보기다", () => {
    expect(parseDashboardParams({ scope: "all" }).showAll).toBe(true);
    expect(parseDashboardParams({ scope: "notable" }).showAll).toBe(false);
    expect(parseDashboardParams({ scope: ["all"] }).showAll).toBe(false);
  });
});

describe("dashboardHref", () => {
  const current = { range: "90d", showAll: false } as const;

  it("현재 상태를 쿼리스트링으로 만든다", () => {
    expect(dashboardHref(current)).toBe("/dashboard?range=90d");
  });

  it("전체 보기는 scope=all을 붙인다", () => {
    expect(dashboardHref({ range: "1y", showAll: true })).toBe("/dashboard?range=1y&scope=all");
  });

  it("override한 값만 갈아끼운다", () => {
    expect(dashboardHref(current, { range: "5y" })).toBe("/dashboard?range=5y");
    expect(dashboardHref(current, { showAll: true })).toBe("/dashboard?range=90d&scope=all");
  });

  it("경로를 바꿔도 상태는 유지된다", () => {
    expect(dashboardHref(current, { showAll: true }, "/export")).toBe(
      "/export?range=90d&scope=all",
    );
  });
});
