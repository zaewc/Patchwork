import type { DashboardCore } from "@/_pages/dashboard/api/loadDashboard";
import type { ImpactEntries } from "@/_pages/dashboard/api/loadImpact";
import { ROUTES, type RangeKey } from "@/shared/config";

type Payload<T> = { data: T } | { error: string };

export class DashboardQueryError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DashboardQueryError";
  }
}

async function unwrap<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as Payload<T>;

  if (!response.ok) {
    throw new DashboardQueryError(
      response.status,
      (payload as { error: string }).error,
    );
  }

  return (payload as { data: T }).data;
}

/** httpOnly 세션 쿠키는 브라우저가 보내고, Query에는 화면 데이터만 남긴다. */
export async function fetchDashboard(range: RangeKey): Promise<DashboardCore> {
  const query = new URLSearchParams({ range });
  return unwrap<DashboardCore>(
    await fetch(`${ROUTES.dashboardData}?${query}`, { cache: "no-store" }),
  );
}

/**
 * 점수표는 따로 받아 온다. 무엇을 물을지는 이미 받아 둔 핵심 데이터에서 나오므로
 * 목록을 몸통에 실어 보낸다 — 주소에 담기에는 너무 길다.
 */
export async function fetchImpact(keys: string[]): Promise<ImpactEntries> {
  return unwrap<ImpactEntries>(
    await fetch(ROUTES.impactData, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
      cache: "no-store",
    }),
  );
}
