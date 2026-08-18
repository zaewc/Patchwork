/** 스켈레톤의 기본 조각. 자리의 크기와 모서리는 부르는 쪽이 정한다. */
export function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />;
}
