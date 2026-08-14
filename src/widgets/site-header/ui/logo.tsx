import { useId } from "react";

/** 네 조각을 이어 붙인 patchwork에서 바늘 모양을 오려낸 마크 */
export function Logo({ size = 20 }: { size?: number }) {
  const cutoutId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <mask id={cutoutId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white" />
          <circle cx="12" cy="9.25" r="4.25" fill="black" />
          <path d="M10.25 11.5 7.5 23h9l-2.75-11.5Z" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${cutoutId})`}>
        <rect x="1" y="1" width="10" height="10" rx="2" fill="var(--patch-4)" />
        <rect x="13" y="1" width="10" height="10" rx="2" fill="var(--patch-2)" />
        <rect x="1" y="13" width="10" height="10" rx="2" fill="var(--patch-1)" />
        <rect x="13" y="13" width="10" height="10" rx="2" fill="var(--patch-3)" />
      </g>
    </svg>
  );
}
