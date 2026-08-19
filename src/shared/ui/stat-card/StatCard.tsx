import { formatNumber } from "@/shared/lib/format";
import { AlertIcon } from "@/shared/ui/icon";

export function StatCard({
  label,
  value,
  numberLocale,
  hint,
  hintTone = "muted",
  accent = false,
}: {
  label: string;
  /** 아직 셀 수 없는 값은 null이다. 그 자리는 숫자 대신 자리만 잡아 둔다. */
  value: number | null;
  /** 자릿점을 찍을 때 쓸 BCP 47 태그 */
  numberLocale: string;
  hint?: string;
  hintTone?: "muted" | "warn";
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 ${
        accent ? "border-l-2 border-l-accent" : ""
      }`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      {value === null ? (
        <>
          <div className="mt-2.5 h-7 w-20 animate-pulse rounded bg-surface-2" />
          <div className="mt-2.5 h-4 w-28 animate-pulse rounded bg-surface-2" />
        </>
      ) : (
        <>
          <p className="mt-2.5 text-[28px] font-semibold leading-none tracking-tight">
            {formatNumber(value, numberLocale)}
          </p>
          {hint ? (
            <p
              className={`mt-2.5 flex items-center gap-1 text-xs leading-4 ${
                hintTone === "warn" ? "text-warn" : "text-muted"
              }`}
            >
              {hintTone === "warn" ? <AlertIcon size={12} /> : null}
              {hint}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
