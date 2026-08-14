import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { GITHUB_OAUTH_TOKEN_URL } from "@/lib/config";
import { fetchViewerIdentity } from "@/lib/github";
import {
  appOrigin,
  cookieOptions,
  seal,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  STATE_COOKIE,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function fail(origin: string, reason: string) {
  const response = NextResponse.redirect(`${origin}/?error=${reason}`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const origin = appOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  if (url.searchParams.get("error")) return fail(origin, "access_denied");
  if (!code || !state || !expectedState || !safeEqual(state, expectedState)) {
    return fail(origin, "invalid_state");
  }

  const tokenResponse = await fetch(GITHUB_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/auth/callback`,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) return fail(origin, "token_exchange_failed");

  const payload = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!payload.access_token) return fail(origin, payload.error ?? "token_exchange_failed");

  try {
    const viewer = await fetchViewerIdentity(payload.access_token);
    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(
      SESSION_COOKIE,
      seal({
        token: payload.access_token,
        login: viewer.login,
        name: viewer.name,
        avatarUrl: viewer.avatarUrl,
      }),
      cookieOptions(SESSION_MAX_AGE),
    );
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch {
    return fail(origin, "identity_failed");
  }
}
