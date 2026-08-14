import { queryOptions } from "@tanstack/react-query";
import { fetchDashboard } from "@/_pages/dashboard/api/fetch-dashboard";
import type { RangeKey } from "@/shared/config";

export const dashboardQueryKey = (range: RangeKey) => ["dashboard", range] as const;

export const dashboardQueryOptions = (range: RangeKey) =>
  queryOptions({
    queryKey: dashboardQueryKey(range),
    queryFn: () => fetchDashboard(range),
  });
