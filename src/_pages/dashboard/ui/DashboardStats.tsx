import type { DashboardView } from "@/_pages/dashboard/lib/dashboardView";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";
import { StatCard } from "@/shared/ui/stat-card";

/**
 * 이끄는 수를 풀어 읽는 셋. 지금 보고 있는 범위에 맞춰 이미 걸러진 수를 받는다.
 *
 * 전체 기여는 여기 없다 — 그것은 `DashboardHero`가 퀼트와 함께 이끈다. 남은 셋은 그 수가
 * 어떤 기여였는지를 말한다: 얼마나 주요 OSS였고, 얼마나 남의 저장소였고, 지금 무엇이
 * 열려 있는가.
 *
 * 셋이 같은 때에 준비되지 않는다. 외부 기여는 GitHub 응답만으로 셀 수 있지만 나머지 둘은
 * repository 점수를 알아야 센다. 아직 셀 수 없는 값은 null로 오고, 그 카드만 숫자 자리를
 * 비워 둔다.
 */
export function DashboardStats({
  notable,
  external,
  openCount,
  staleCount,
  mergedCount,
  dict,
}: Pick<DashboardView, "external"> & {
  notable: DashboardView["notable"] | null;
  openCount: number | null;
  staleCount: number | null;
  mergedCount: number | null;
  dict: Dictionary;
}) {
  const { numberLocale } = dict;
  const { stats } = dict.dashboard;

  const notableHint = notable
    ? { hint: interpolate(stats.notableHint, { count: notable.repos }) }
    : {};

  /** 열린 PR이 오래 멈춰 있는 것은 살펴봐야 할 일이라 덧말도 그렇게 입는다. */
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
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
