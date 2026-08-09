import { NextResponse } from "next/server";
import { appOrigin, SESSION_COOKIE, STATE_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

function clear(request: Request) {
  const response = NextResponse.redirect(`${appOrigin(request)}/`, { status: 303 });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function POST(request: Request) {
  return clear(request);
}

export async function GET(request: Request) {
  return clear(request);
}
