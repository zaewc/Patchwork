import { parseRange, type RangeKey } from "@/lib/github";

/** 대시보드 URL이 담는 상태. 쿼리스트링을 만드는 곳은 여기 하나뿐이다. */
export type DashboardParams = {
  range: RangeKey;
  /** true면 일반 프로젝트까지 본다. 기본은 주요 OSS만. */
  showAll: boolean;
};

export function parseDashboardParams(
  params: Record<string, string | string[] | undefined>,
): DashboardParams {
  return { range: parseRange(params.range), showAll: params.scope === "all" };
}

export function dashboardHref(
  current: DashboardParams,
  overrides: Partial<DashboardParams> = {},
  path = "/dashboard",
): string {
  const { range, showAll } = { ...current, ...overrides };
  const query = new URLSearchParams({ range });
  if (showAll) query.set("scope", "all");
  return `${path}?${query}`;
}
