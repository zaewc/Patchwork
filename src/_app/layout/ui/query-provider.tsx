"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { makeQueryClient } from "@/shared/lib/query-client";

/** 요청끼리 캐시가 섞이지 않고 브라우저에서는 같은 캐시를 이어 쓰게 한다. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
