import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import type { GitHubViewer } from "@/shared/api";

export const SESSION_COOKIE = "pw_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

/** 쿠키에 봉인해 두는 것: GitHub 토큰과, 헤더를 그리는 데 필요한 최소한의 사용자 정보. */
export type Session = GitHubViewer & { token: string };

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

/** 봉인을 푼다. 위조·손상·다른 열쇠로 만든 값은 모두 null이다. */
export function unseal(value: string): Session | null {
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length <= 28) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString(
      "utf8",
    );
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
