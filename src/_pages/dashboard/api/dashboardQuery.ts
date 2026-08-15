import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { fetchDashboard } from "@/_pages/dashboard/api/fetchDashboard";
import type { RangeKey } from "@/shared/config";

export const dashboardQueryKey = (range: RangeKey) =>
  ["dashboard", range] as const;

const FRESH_MS = 5 * 60_000;
const KEEP_MS = 30 * 60_000;

export const dashboardQueryOptions = (range: RangeKey) =>
  queryOptions({
    queryKey: dashboardQueryKey(range),
    queryFn: () => fetchDashboard(range),
    staleTime: FRESH_MS,
    gcTime: KEEP_MS,
    placeholderData: keepPreviousData,
  });
