import type { DashboardData } from "@/_pages/dashboard/api/load-dashboard";
import { formatNumber } from "@/shared/lib/format";
import { StatCard } from "@/shared/ui/stat-card";

/** 화면 맨 위의 지표 넷. 지금 보고 있는 범위에 맞춰 이미 걸러진 수를 받는다. */
export function DashboardStats({
  totals,
  notable,
  external,
  openCount,
  staleCount,
  mergedCount,
}: Pick<DashboardData, "totals" | "notable" | "external"> & {
  openCount: number;
  staleCount: number;
  mergedCount: number;
}) {
  const restrictedHint =
    totals.restricted > 0
      ? { hint: `Private ${formatNumber(totals.restricted)}건 포함` }
      : {};

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Contributions"
        value={totals.contributions}
        {...restrictedHint}
      />
      <StatCard
        label="주요 OSS 기여"
        value={notable.contributions}
        hint={`repository ${notable.repos}곳`}
        accent
      />
      <StatCard
        label="외부 Repository 기여"
        value={external.contributions}
        hint={`전체의 ${external.ratio}%`}
      />
      <StatCard
        label="Open pull requests"
        value={openCount}
        hint={
          staleCount > 0 ? `Stale ${staleCount}건` : `Merged ${mergedCount}건`
        }
      />
    </div>
  );
}
