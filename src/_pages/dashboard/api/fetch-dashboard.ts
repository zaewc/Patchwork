import type { DashboardData } from "@/_pages/dashboard/api/load-dashboard";
import { ROUTES, type RangeKey } from "@/shared/config";

type DashboardResponse = { data: DashboardData } | { error: string };

export class DashboardQueryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DashboardQueryError";
  }
}

/** httpOnly 세션 쿠키는 브라우저가 보내고, Query에는 화면 데이터만 남긴다. */
export async function fetchDashboard(range: RangeKey): Promise<DashboardData> {
  const query = new URLSearchParams({ range });
  const response = await fetch(`${ROUTES.dashboardData}?${query}`, { cache: "no-store" });
  const payload = (await response.json()) as DashboardResponse;

  if (!response.ok) {
    throw new DashboardQueryError(response.status, (payload as { error: string }).error);
  }

  return (payload as { data: DashboardData }).data;
}
