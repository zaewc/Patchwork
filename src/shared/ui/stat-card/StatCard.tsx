import { formatNumber } from "@/shared/lib/format";

export function StatCard({
  label,
  value,
  numberLocale,
  hint,
  accent = false,
}: {
  label: string;
  value: number;
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
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {formatNumber(value, numberLocale)}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
