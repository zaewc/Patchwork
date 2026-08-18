import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  fetchDashboard,
  fetchImpact,
} from "@/_pages/dashboard/api/fetchDashboard";
import type { ImpactEntries } from "@/_pages/dashboard/api/loadImpact";
import type { RangeKey } from "@/shared/config";

export const dashboardQueryKey = (range: RangeKey) =>
  ["dashboard", range] as const;

export const impactQueryKey = (range: RangeKey) => ["impact", range] as const;

const FRESH_MS = 5 * 60_000;
const KEEP_MS = 30 * 60_000;

const SHELF_LIFE = {
  staleTime: FRESH_MS,
  gcTime: KEEP_MS,
  placeholderData: keepPreviousData,
} as const;

export const dashboardQueryOptions = (range: RangeKey) =>
  queryOptions({
    queryKey: dashboardQueryKey(range),
    queryFn: () => fetchDashboard(range),
    ...SHELF_LIFE,
  });

/**
 * 점수표 조회.
 *
 * `keys`가 null이면 핵심 데이터가 아직 없어 무엇을 물어야 할지 모르는 상태다. 그때는
 * 조회를 열지 않는다. 목록이 비어 있을 때는 물을 것이 없으므로 빈 점수표로 바로 답한다 —
 * 이 자리를 조회 자체를 끄는 것으로 처리하면 점수표가 영원히 오지 않아 화면이 멈춘다.
 */
export const impactQueryOptions = (range: RangeKey, keys: string[] | null) =>
  queryOptions({
    queryKey: impactQueryKey(range),
    queryFn: (): Promise<ImpactEntries> =>
      keys && keys.length > 0 ? fetchImpact(keys) : Promise.resolve([]),
    enabled: keys !== null,
    ...SHELF_LIFE,
  });
