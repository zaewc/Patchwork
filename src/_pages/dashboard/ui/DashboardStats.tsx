import type { DashboardView } from "@/_pages/dashboard/lib/dashboardView";
import { formatNumber } from "@/shared/lib/format";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";
import { StatCard } from "@/shared/ui/stat-card";

/**
 * 화면 맨 위의 지표 넷. 지금 보고 있는 범위에 맞춰 이미 걸러진 수를 받는다.
 *
 * 넷이 같은 때에 준비되지 않는다. 전체 기여와 외부 기여는 GitHub 응답만으로 셀 수 있지만,
 * 주요 OSS 기여와 걸러낸 PR 수는 repository 점수를 알아야 센다. 아직 셀 수 없는 값은
 * null로 오고, 그 카드만 숫자 자리를 비워 둔다.
 */
export function DashboardStats({
  totals,
  notable,
  external,
  openCount,
  staleCount,
  mergedCount,
  dict,
}: Pick<DashboardView, "totals" | "external"> & {
  notable: DashboardView["notable"] | null;
  openCount: number | null;
  staleCount: number | null;
  mergedCount: number | null;
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

  const notableHint = notable
    ? { hint: interpolate(stats.notableHint, { count: notable.repos }) }
    : {};

  const openHint =
    staleCount !== null && mergedCount !== null
      ? staleCount > 0
        ? {
            hint: interpolate(stats.staleHint, { count: staleCount }),
            hintTone: "warn" as const,
          }
        : { hint: interpolate(stats.mergedHint, { count: mergedCount }) }
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
        value={notable?.contributions ?? null}
        numberLocale={numberLocale}
        {...notableHint}
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
        {...openHint}
      />
    </div>
  );
}
