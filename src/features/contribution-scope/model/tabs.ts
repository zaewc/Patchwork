import {
  scopeHref,
  type ScopeParams,
} from "@/features/contribution-scope/model/params";
import { RANGES, type RangeKey } from "@/shared/config";
import type { Tab } from "@/shared/ui/tab-bar";

const SCOPES = [
  { showAll: false, label: "주요 OSS" },
  { showAll: true, label: "전체" },
];

function tab(
  current: ScopeParams,
  override: Partial<ScopeParams>,
  label: string,
  path: string,
): Tab<ScopeParams> {
  const next = { ...current, ...override };
  return {
    href: scopeHref(current, override, path),
    label,
    // 눌러도 지금과 같은 조건이면 그 탭이 선택된 상태다.
    active: next.range === current.range && next.showAll === current.showAll,
    value: next,
  };
}

/**
 * 조회 조건 탭 두 줄(보기 범위 · 기간).
 * 링크로 이동하든 자리에서 갈아끼우든 같은 목록을 쓴다.
 *
 * `id`는 조건이 바뀌어도 그대로다. 주소로 묶음을 가리면 `range=30d`일 때
 * 두 줄의 첫 주소가 겹쳐 서로를 지운다.
 */
export type ScopeTabGroup = { id: string; items: Tab<ScopeParams>[] };

export function scopeTabGroups(
  params: ScopeParams,
  path: string,
): ScopeTabGroup[] {
  return [
    {
      id: "scope",
      items: SCOPES.map(({ showAll, label }) =>
        tab(params, { showAll }, label, path),
      ),
    },
    {
      id: "range",
      items: (Object.keys(RANGES) as RangeKey[]).map((range) =>
        tab(params, { range }, RANGES[range].label, path),
      ),
    },
  ];
}
