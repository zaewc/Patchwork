import { randomBytes, timingSafeEqual } from "node:crypto";

export const STATE_COOKIE = "pw_oauth_state";

/** 인가 화면을 다녀오기에 충분하고, 방치된 요청은 만료되는 시간 */
export const STATE_MAX_AGE = 600;

/** CSRF 방지용 한 번 쓰는 값 */
export const createState = () => randomBytes(16).toString("base64url");

/**
 * 요청에 실려 온 state를 꺼낸다. 라우트 핸들러에는 요청 쿠키가 헤더로만 들어오므로
 * 직접 훑는다.
 */
export function readState(request: Request): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
}

/** 길이가 같을 때만 비교하고, 비교 시간이 값에 따라 달라지지 않게 한다. */
export function statesMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
