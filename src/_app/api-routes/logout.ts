import { NextResponse } from "next/server";
import { STATE_COOKIE } from "@/_app/api-routes/oauth-state";
import { SESSION_COOKIE } from "@/entities/viewer";
import { ROUTES, appOrigin } from "@/shared/config";

/**
 * 쿠키를 지우고 홈으로 되돌린다.
 * 303이라야 브라우저가 폼의 POST를 GET으로 바꿔 따라간다.
 */
export function handleLogout(request: Request) {
  const response = NextResponse.redirect(`${appOrigin(request)}${ROUTES.home}`, { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
