import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export const SESSION_COOKIE = "pw_session";
export const STATE_COOKIE = "pw_oauth_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export type Session = {
  token: string;
  login: string;
  name: string | null;
  avatarUrl: string;
};

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (!cachedKey) {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        "SESSION_SECRET 환경변수가 필요합니다 (32자 이상). `openssl rand -hex 32` 로 생성하세요.",
      );
    }
    cachedKey = scryptSync(secret, "patchwork.session.v1", 32);
  }
  return cachedKey;
}

/** 세션을 AES-256-GCM으로 암호화해 쿠키에 담을 수 있는 문자열로 만든다. */
export function seal(session: Session): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unseal(value: string): Session | null {
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length <= 28) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Session).token === "string" &&
      typeof (parsed as Session).login === "string"
    ) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? unseal(value) : null;
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** OAuth 앱이 설정돼 있는지 (로그인 버튼 노출 여부 판단용). */
export function isConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.SESSION_SECRET,
  );
}

/** 리다이렉트 URL 계산. APP_URL이 있으면 우선, 없으면 요청 origin. */
export function appOrigin(request: Request): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}
