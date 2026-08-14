import { TIER_BADGE_CLASS, tierMeta, type ImpactTier } from "@/lib/impact";

/** 커뮤니티 등급부터만 표시한다. 자격 미달(unranked)은 아무것도 그리지 않는다. */
export function TierBadge({ tier, score }: { tier: ImpactTier; score?: number }) {
  if (tier === "unranked") return null;
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
