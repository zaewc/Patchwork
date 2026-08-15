"use client";

import { useCallback, useEffect, useState } from "react";
import {
  parseScopeParams,
  scopeHref,
  type ScopeParams,
} from "@/features/contribution-scope/model/params";

const paramsFromLocation = (): ScopeParams =>
  parseScopeParams(
    Object.fromEntries(new URLSearchParams(window.location.search)),
  );

export function useScopeParams(initial: ScopeParams, path: string) {
  const [params, setParams] = useState(initial);

  useEffect(() => {
    const sync = () => setParams(paramsFromLocation());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const select = useCallback(
    (next: ScopeParams) => {
      window.history.pushState(null, "", scopeHref(next, {}, path));
      setParams(next);
    },
    [path],
  );

  return [params, select] as const;
}
