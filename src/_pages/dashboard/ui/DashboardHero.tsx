import type { DashboardCore } from "@/_pages/dashboard/api/loadDashboard";
import { ContributionQuilt } from "@/_pages/dashboard/ui/ContributionQuilt";
import { formatNumber } from "@/shared/lib/format";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";

/**
 * 이 화면이 시작하는 자리.
 *
 * 예전에는 이름이 홀로 뜨고, 어느 대시보드에나 있는 지표 상자 넷이 먼저 오고, 정작 이 앱의
 * 이름인 퀼트가 세 번째에 테두리 상자 안에 묻혀 있었다. 셋을 한 판 안에 모아 첫 화면이
 * "누구의, 얼마만큼의, 어떤 모양의 한 해"를 한 번에 말하게 한다.
 *
 * 이끄는 수는 전체 기여다. 바로 아래 퀼트가 같은 것을 그림으로 말하므로 둘이 한 몸이고,
 * 이 판은 GitHub 응답만으로 그려지므로 점수 조회를 기다리지 않는다.
 */
export function DashboardHero({
  viewer,
  totals,
  weeks,
  rangeLabel,
  dict,
  actions,
}: Pick<DashboardCore, "viewer" | "totals" | "weeks"> & {
  /** 지금 보고 있는 기간의 이름. 이끄는 수가 무엇의 합인지 말해 준다. */
  rangeLabel: string;
  dict: Dictionary;
  /** 조회 조건을 바꾸는 것들. 판 안에 두어야 무엇에 걸리는 조건인지 붙어 보인다. */
  actions: React.ReactNode;
}) {
  const { numberLocale } = dict;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="rounded-full border border-border"
          />
          <div>
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {viewer.name ?? viewer.login}
            </h1>
            <p className="text-xs text-muted">@{viewer.login}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      {/* 화면이 이끄는 수 하나. 자릿수는 맞추지 않는다 — 세로로 늘어설 일이 없다. */}
      <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-5xl font-semibold leading-none tracking-tight">
          {formatNumber(totals.contributions, numberLocale)}
        </span>
        <span className="text-sm text-muted">Contributions · {rangeLabel}</span>
        {totals.restricted > 0 ? (
          <>
            {/* 가운뎃점은 눈으로 가르는 장식이라 읽어 줄 것이 없다. */}
            <span aria-hidden className="text-xs text-muted">
              ·
            </span>
            <span className="text-xs text-muted">
              {interpolate(dict.dashboard.stats.privateHint, {
                count: formatNumber(totals.restricted, numberLocale),
              })}
            </span>
          </>
        ) : null}
      </p>

      <div className="mt-6">
        <ContributionQuilt weeks={weeks} />
      </div>
    </section>
  );
}
