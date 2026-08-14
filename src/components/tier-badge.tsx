import { TIER_BADGE_CLASS, tierMeta, type ImpactTier } from "@/lib/impact";

export function TierBadge({ tier, score }: { tier: ImpactTier; score?: number }) {
  if (tier === "personal") return null;
  const meta = tierMeta(tier);

  return (
    <span
      title={score === undefined ? meta.description : `${meta.description} · ${score}/100`}
      className={`shrink-0 rounded px-1.5 py-px text-[11px] ${TIER_BADGE_CLASS[tier]}`}
    >
      {meta.label}
    </span>
  );
}
