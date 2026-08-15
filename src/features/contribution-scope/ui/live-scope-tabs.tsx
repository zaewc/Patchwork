import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { scopeTabGroups } from "@/features/contribution-scope/model/tabs";
import { TabBar, type InPlace } from "@/shared/ui/tab-bar";

export function LiveScopeTabs({
  params,
  path,
  inPlace,
}: {
  params: ScopeParams;
  path: string;
  inPlace: InPlace<ScopeParams>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scopeTabGroups(params, path).map((items) => (
        <TabBar key={items[0]!.href} items={items} inPlace={inPlace} />
      ))}
    </div>
  );
}
