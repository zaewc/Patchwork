import type { DashboardData } from "@/_pages/dashboard/api/loadDashboard";
import { formatNumber } from "@/shared/lib/format";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";
import { StatCard } from "@/shared/ui/stat-card";

/** 화면 맨 위의 지표 넷. 지금 보고 있는 범위에 맞춰 이미 걸러진 수를 받는다. */
export function DashboardStats({
  totals,
  notable,
  external,
  openCount,
  staleCount,
  mergedCount,
  dict,
}: Pick<DashboardData, "totals" | "notable" | "external"> & {
  openCount: number;
  staleCount: number;
  mergedCount: number;
  dict: Dictionary;
}) {
  const { numberLocale } = dict;
  const { stats } = dict.dashboard;

  const restrictedHint =
    totals.restricted > 0
      ? {
          hint: interpolate(stats.privateHint, {
            count: formatNumber(totals.restricted, numberLocale),
          }),
        }
      : {};

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Contributions"
        value={totals.contributions}
        numberLocale={numberLocale}
        {...restrictedHint}
      />
      <StatCard
        label={stats.notable}
        value={notable.contributions}
        numberLocale={numberLocale}
        hint={interpolate(stats.notableHint, { count: notable.repos })}
        accent
      />
      <StatCard
        label={stats.external}
        value={external.contributions}
        numberLocale={numberLocale}
        hint={interpolate(stats.externalHint, { ratio: external.ratio })}
      />
      <StatCard
        label="Open pull requests"
        value={openCount}
        numberLocale={numberLocale}
        hint={
          staleCount > 0
            ? interpolate(stats.staleHint, { count: staleCount })
            : interpolate(stats.mergedHint, { count: mergedCount })
        }
      />
    </div>
  );
}
