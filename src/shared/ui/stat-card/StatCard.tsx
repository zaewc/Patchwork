import { formatNumber } from "@/shared/lib/format";

export function StatCard({
  label,
  value,
  numberLocale,
  hint,
  accent = false,
}: {
  label: string;
  /** 아직 셀 수 없는 값은 null이다. 그 자리는 숫자 대신 자리만 잡아 둔다. */
  value: number | null;
  /** 자릿점을 찍을 때 쓸 BCP 47 태그 */
  numberLocale: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-accent/40 bg-accent-soft" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      {value === null ? (
        <>
          <div className="mt-1 h-8 w-20 animate-pulse rounded bg-surface-2" />
          <div className="mt-1 h-4 w-28 animate-pulse rounded bg-surface-2" />
        </>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatNumber(value, numberLocale)}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </>
      )}
    </div>
  );
}
