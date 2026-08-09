import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { appOrigin, cookieOptions, STATE_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const origin = appOrigin(request);

  if (!clientId || !process.env.GITHUB_CLIENT_SECRET || !process.env.SESSION_SECRET) {
    return NextResponse.redirect(`${origin}/?error=not_configured`);
  }

  const state = randomBytes(16).toString("base64url");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  authorize.searchParams.set("scope", process.env.GITHUB_OAUTH_SCOPES ?? "read:user");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize.toString());
  response.cookies.set(STATE_COOKIE, state, cookieOptions(600));
  return response;
}
