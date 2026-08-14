import { NextResponse } from "next/server";
import {
  createState,
  STATE_COOKIE,
  STATE_MAX_AGE,
} from "@/_app/api-routes/oauth-state";
import { GITHUB_OAUTH_AUTHORIZE_URL, ROUTES, appOrigin, oauthApp } from "@/shared/config";
import { cookieOptions } from "@/shared/lib/cookie";

/** GitHub 인가 화면으로 보낸다. 돌아올 때 확인할 state를 쿠키에 함께 심는다. */
export function handleLogin(request: Request) {
  const origin = appOrigin(request);
  const app = oauthApp();

  if (!app) {
    return NextResponse.redirect(`${origin}${ROUTES.home}?error=not_configured`);
  }

  const state = createState();
  const authorize = new URL(GITHUB_OAUTH_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", app.clientId);
  authorize.searchParams.set("redirect_uri", `${origin}${ROUTES.callback}`);
  authorize.searchParams.set("scope", process.env.GITHUB_OAUTH_SCOPES ?? "read:user");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize.toString());
  response.cookies.set(STATE_COOKIE, state, cookieOptions(STATE_MAX_AGE));
  return response;
}
