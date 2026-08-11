import { TIER_BADGE_CLASS, tierMeta, type ImpactTier } from "@/lib/impact";

export function TierBadge({
  tier,
  score,
  compact = false,
}: {
  tier: ImpactTier;
  score?: number;
  compact?: boolean;
}) {
  if (tier === "personal") return null;
  const meta = tierMeta(tier);

  return (
    <span
      title={
        score === undefined
          ? meta.description
          : `${meta.description} · 권위 점수 ${score}/100`
      }
      className={`shrink-0 rounded px-1.5 py-px text-[11px] font-medium ${TIER_BADGE_CLASS[tier]}`}
    >
      {compact && tier === "flagship" ? "대표" : meta.label}
    </span>
  );
}
