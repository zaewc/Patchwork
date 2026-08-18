"use client";

import { useState } from "react";

/**
 * 짝이 맞는 마지막 값을 붙들어 둔다.
 *
 * 핵심 데이터와 점수표는 서로 다른 조회다. 그래서 다른 기간으로 옮기면 새 핵심 데이터가
 * 먼저 도착하고 그 기간의 점수표는 아직인 순간이 생긴다. 그 사이에 둘을 억지로 합치면
 * 이전 기간의 점수로 새 목록을 걸러 잠깐 엉뚱한 줄이 보이고, 스켈레톤으로 되돌리면 화면이
 * 두 번 깜빡인다. 어느 쪽도 좋지 않으므로 짝이 맞는 직전 화면을 그대로 두고 흐림만 얹는다.
 *
 * 부르는 쪽은 `paired`를 `useMemo`로 감싸 값이 그대로일 때 같은 참조를 넘겨야 한다.
 */
export function useLastPaired<T>(paired: T | null): T | null {
  const [kept, setKept] = useState<T | null>(null);

  if (paired !== null && paired !== kept) setKept(paired);

  return paired ?? kept;
}
