import { parseRange, type RangeKey } from "@/shared/config";

/** 대시보드·내보내기 화면이 URL에 담는 상태. 쿼리스트링을 만드는 곳은 여기 하나뿐이다. */
export type ScopeParams = {
  range: RangeKey;
  /** true면 일반 프로젝트까지 본다. 기본은 주요 OSS만. */
  showAll: boolean;
};

export function parseScopeParams(
  params: Record<string, string | string[] | undefined>,
): ScopeParams {
  return { range: parseRange(params.range), showAll: params.scope === "all" };
}

/** 지금 보고 있는 조건에서 일부만 갈아끼운 주소를 만든다. */
export function scopeHref(
  current: ScopeParams,
  overrides: Partial<ScopeParams>,
  path: string,
): string {
  const { range, showAll } = { ...current, ...overrides };
  const query = new URLSearchParams({ range });
  if (showAll) query.set("scope", "all");
  return `${path}?${query}`;
}
