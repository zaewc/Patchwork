import { appOrigin, ROUTES } from "@/shared/config";

/**
 * 보내 온 곳으로 되돌려 보낼 주소.
 *
 * 머리에서 무언가를 고르는 폼(언어·테마)이 쓴다. 헤더는 모든 화면에 있고 조회 조건은
 * 주소에 담겨 있으므로, 왔던 곳(Referer)으로 그대로 돌려보내면 보던 화면이 그대로 남는다.
 *
 * 우리 주소로 시작하는 것만 따라간다. 끝의 `/`까지 맞춰 보는 것은 `patchwork.dev`가
 * `patchwork.dev.evil.example`을 통과시키지 않게 하기 위해서다. 바깥으로 튕겨 보내는
 * 구멍이 되기 쉬운 자리라 한 곳에만 두고 두 폼이 같은 것을 쓴다.
 */
export function returnTo(request: Request): string {
  const origin = appOrigin(request);
  const referer = request.headers.get("referer") ?? "";
  return referer.startsWith(`${origin}/`) ? referer : `${origin}${ROUTES.home}`;
}
