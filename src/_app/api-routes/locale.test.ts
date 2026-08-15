import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleLocale } from "@/_app/api-routes/locale";

const ORIGIN = "http://localhost:3000";

function request(locale: string | null, referer?: string) {
  const body = new FormData();
  if (locale !== null) body.set("locale", locale);

  return new Request(`${ORIGIN}/api/locale`, {
    method: "POST",
    body,
    headers: referer === undefined ? {} : { referer },
  });
}

const cookieOf = (response: Response) =>
  response.headers.getSetCookie().find((c) => c.startsWith("pw_locale="));

beforeEach(() => {
  vi.stubEnv("APP_URL", ORIGIN);
});

describe("POST /api/locale", () => {
  it("고른 언어를 쿠키에 심는다", async () => {
    const response = await handleLocale(request("en"));

    expect(cookieOf(response)).toContain("pw_locale=en");
    expect(cookieOf(response)).toContain("Max-Age=31536000");
  });

  it("브라우저가 폼 POST를 GET으로 바꿔 따라가도록 303으로 돌린다", async () => {
    const response = await handleLocale(request("ko"));
    expect(response.status).toBe(303);
  });

  it("보던 화면으로 되돌린다 — 조회 조건도 그대로 남는다", async () => {
    const response = await handleLocale(
      request("en", `${ORIGIN}/dashboard?range=90d&scope=all`),
    );

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/dashboard?range=90d&scope=all`,
    );
  });

  it("Referer가 없으면 홈으로 간다", async () => {
    const response = await handleLocale(request("en"));
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });

  /** origin으로 시작하기만 하는 주소로 새어 나가지 않아야 한다. */
  it("다른 사이트로는 돌려보내지 않는다", async () => {
    for (const referer of [
      "https://evil.example/dashboard",
      `${ORIGIN}.evil.example/dashboard`,
    ]) {
      const response = await handleLocale(request("en", referer));
      expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    }
  });

  it("모르는 언어를 보내면 기본 언어로 떨어진다", async () => {
    expect(cookieOf(await handleLocale(request("fr")))).toContain(
      "pw_locale=ko",
    );
    expect(cookieOf(await handleLocale(request(null)))).toContain(
      "pw_locale=ko",
    );
  });

  it("쿠키는 브라우저 스크립트가 읽지 못하게 심는다", async () => {
    const cookie = cookieOf(await handleLocale(request("en")));

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
  });
});
