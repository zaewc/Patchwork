import { NextResponse } from "next/server";
import { returnTo } from "@/_app/api-routes/returnTo";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  parseLocale,
} from "@/shared/config";
import { cookieOptions } from "@/shared/lib/cookie";

/**
 * 고른 언어를 쿠키에 심고 보던 자리로 되돌린다.
 * 303이라야 브라우저가 폼의 POST를 GET으로 바꿔 따라간다.
 */
export async function handleLocale(request: Request) {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale")) ?? DEFAULT_LOCALE;

  const response = NextResponse.redirect(returnTo(request), { status: 303 });
  response.cookies.set(LOCALE_COOKIE, locale, cookieOptions(LOCALE_MAX_AGE));
  return response;
}
