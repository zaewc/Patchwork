import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { scopeTabGroups } from "@/features/contribution-scope/model/tabs";
import { TabBar } from "@/shared/ui/tab-bar";

/**
 * 조회 조건을 바꾸는 탭 묶음. 누르면 서버를 다시 다녀온다.
 * 화면 내용이 서버에서 만들어지는 곳(내보내기)이 이것을 쓴다.
 * 이미 받아 둔 데이터로 자리에서 바꿀 수 있으면 `LiveScopeTabs`를 쓴다.
 */
export function ScopeTabs({
  params,
  path,
}: {
  params: ScopeParams;
  path: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scopeTabGroups(params, path).map((group) => (
        <TabBar key={group.id} items={group.items} />
      ))}
    </div>
  );
}
