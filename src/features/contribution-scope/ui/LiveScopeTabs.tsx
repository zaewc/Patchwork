import type { ScopeParams } from "@/features/contribution-scope/model/params";
import { scopeTabGroups } from "@/features/contribution-scope/model/tabs";
import type { Dictionary } from "@/shared/lib/i18n";
import { TabBar, type InPlace } from "@/shared/ui/tab-bar";

export function LiveScopeTabs({
  params,
  path,
  dict,
  inPlace,
}: {
  params: ScopeParams;
  path: string;
  dict: Dictionary;
  inPlace: InPlace<ScopeParams>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scopeTabGroups(params, path, dict).map((group) => (
        <TabBar key={group.id} items={group.items} inPlace={inPlace} />
      ))}
    </div>
  );
}
