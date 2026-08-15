import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  ROUTES,
  appOrigin,
  parseLocale,
} from "@/shared/config";
import { cookieOptions } from "@/shared/lib/cookie";

/**
 * 언어를 고른 자리로 되돌린다.
 *
 * 헤더는 모든 화면에 있고 조회 조건은 주소에 담겨 있으므로, 보내 온 곳(Referer)으로
 * 그대로 돌려보내면 보던 화면이 그대로 남는다.
 *
 * 우리 주소로 시작하는 것만 따라간다. 끝의 `/`까지 맞춰 보는 것은 `patchwork.dev`가
 * `patchwork.dev.evil.example`을 통과시키지 않게 하기 위해서다.
 */
function returnTo(request: Request): string {
  const origin = appOrigin(request);
  const referer = request.headers.get("referer") ?? "";
  return referer.startsWith(`${origin}/`) ? referer : `${origin}${ROUTES.home}`;
}

/**
 * 고른 언어를 쿠키에 심는다.
 * 303이라야 브라우저가 폼의 POST를 GET으로 바꿔 따라간다.
 */
export async function handleLocale(request: Request) {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale")) ?? DEFAULT_LOCALE;

  const response = NextResponse.redirect(returnTo(request), { status: 303 });
  response.cookies.set(LOCALE_COOKIE, locale, cookieOptions(LOCALE_MAX_AGE));
  return response;
}
