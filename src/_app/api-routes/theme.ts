import { NextResponse } from "next/server";
import { returnTo } from "@/_app/api-routes/returnTo";
import {
  DEFAULT_THEME,
  parseTheme,
  THEME_COOKIE,
  THEME_MAX_AGE,
} from "@/shared/config";
import { cookieOptions } from "@/shared/lib/cookie";

/**
 * 고른 테마를 쿠키에 심고 보던 자리로 되돌린다.
 *
 * 303이라야 브라우저가 폼의 POST를 GET으로 바꿔 따라간다. 돌아온 요청을 그리면서
 * 레이아웃이 쿠키를 읽어 `<html data-theme>`에 적으므로, 첫 그림부터 고른 색이다.
 */
export async function handleTheme(request: Request) {
  const form = await request.formData();
  const theme = parseTheme(form.get("theme")) ?? DEFAULT_THEME;

  const response = NextResponse.redirect(returnTo(request), { status: 303 });
  response.cookies.set(THEME_COOKIE, theme, cookieOptions(THEME_MAX_AGE));
  return response;
}
