import { NextResponse } from "next/server";
import { readState, STATE_COOKIE, statesMatch } from "@/_app/api-routes/oauth-state";
import { fetchViewerIdentity, seal, SESSION_COOKIE, SESSION_MAX_AGE } from "@/entities/viewer";
import { GITHUB_OAUTH_TOKEN_URL, ROUTES, appOrigin, oauthApp } from "@/shared/config";
import { cookieOptions } from "@/shared/lib/cookie";

/** 실패는 모두 홈으로 되돌리고 사유를 쿼리로 남긴다. 쓰던 state는 정리한다. */
function fail(origin: string, reason: string) {
  const response = NextResponse.redirect(`${origin}${ROUTES.home}?error=${reason}`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string } | { error: string }> {
  const app = oauthApp();
  if (!app) return { error: "not_configured" };

  const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) return { error: "token_exchange_failed" };

  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!payload.access_token) return { error: payload.error ?? "token_exchange_failed" };
  return { accessToken: payload.access_token };
}

/**
 * GitHub이 인가를 마치고 되돌려보낸 요청. state를 맞춰 본 뒤 code를 토큰으로 바꾸고,
 * 그 토큰이 누구의 것인지 확인해 세션을 봉인한다.
 */
export async function handleCallback(request: Request) {
  const origin = appOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readState(request);

  if (url.searchParams.get("error")) return fail(origin, "access_denied");
  if (!code || !state || !expectedState || !statesMatch(state, expectedState)) {
    return fail(origin, "invalid_state");
  }

  const redirectUri = `${origin}${ROUTES.callback}`;
  const exchanged = await exchangeCode(code, redirectUri);
  if ("error" in exchanged) return fail(origin, exchanged.error);

  try {
    const viewer = await fetchViewerIdentity(exchanged.accessToken);
    const response = NextResponse.redirect(`${origin}${ROUTES.dashboard}`);
    response.cookies.set(
      SESSION_COOKIE,
      seal({ token: exchanged.accessToken, ...viewer }),
      cookieOptions(SESSION_MAX_AGE),
    );
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    return fail(origin, "identity_failed");
  }
}
