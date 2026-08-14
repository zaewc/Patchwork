import { scopeHref, type ScopeParams } from "@/features/contribution-scope/model/params";
import { RANGES, type RangeKey } from "@/shared/config";
import { TabBar } from "@/shared/ui/tab-bar";

const SCOPES = [
  { showAll: false, label: "주요 OSS" },
  { showAll: true, label: "전체" },
];

/**
 * 조회 조건을 바꾸는 탭 묶음. 대시보드와 내보내기 화면이 같은 것을 쓴다.
 * 링크만 바뀌므로 클라이언트 상태 없이 서버 컴포넌트로 그린다.
 */
export function ScopeTabs({ params, path }: { params: ScopeParams; path: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TabBar
        items={SCOPES.map(({ showAll, label }) => ({
          href: scopeHref(params, { showAll }, path),
          label,
          active: showAll === params.showAll,
        }))}
      />
      <TabBar
        items={(Object.keys(RANGES) as RangeKey[]).map((range) => ({
          href: scopeHref(params, { range }, path),
          label: RANGES[range].label,
          active: range === params.range,
        }))}
      />
    </div>
  );
}
