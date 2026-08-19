import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleTheme } from "@/_app/api-routes/theme";

const ORIGIN = "http://localhost:3000";

function request(theme: string | null, referer?: string) {
  const body = new FormData();
  if (theme !== null) body.set("theme", theme);

  return new Request(`${ORIGIN}/api/theme`, {
    method: "POST",
    body,
    headers: referer === undefined ? {} : { referer },
  });
}

const cookieOf = (response: Response) =>
  response.headers.getSetCookie().find((c) => c.startsWith("pw_theme="));

beforeEach(() => {
  vi.stubEnv("APP_URL", ORIGIN);
});

describe("POST /api/theme", () => {
  it("고른 테마를 쿠키에 심는다", async () => {
    const response = await handleTheme(request("dark"));

    expect(cookieOf(response)).toContain("pw_theme=dark");
    expect(cookieOf(response)).toContain("Max-Age=31536000");
  });

  it("브라우저가 폼 POST를 GET으로 바꿔 따라가도록 303으로 돌린다", async () => {
    expect((await handleTheme(request("light"))).status).toBe(303);
  });

  it("보던 화면으로 되돌린다 — 조회 조건도 그대로 남는다", async () => {
    const response = await handleTheme(
      request("dark", `${ORIGIN}/dashboard?range=90d&scope=all`),
    );

    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/dashboard?range=90d&scope=all`,
    );
  });

  /** 언어 전환과 같은 안전장치를 쓴다. 한 곳(returnTo)만 고치면 둘 다 고쳐진다. */
  it("다른 사이트로는 돌려보내지 않는다", async () => {
    for (const referer of [
      "https://evil.example/dashboard",
      `${ORIGIN}.evil.example/dashboard`,
      undefined,
    ]) {
      const response = await handleTheme(request("dark", referer));
      expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    }
  });

  it("모르는 테마를 보내면 system으로 떨어진다", async () => {
    expect(cookieOf(await handleTheme(request("solarized")))).toContain(
      "pw_theme=system",
    );
    expect(cookieOf(await handleTheme(request(null)))).toContain(
      "pw_theme=system",
    );
  });

  it("쿠키는 브라우저 스크립트가 읽지 못하게 심는다", async () => {
    const cookie = cookieOf(await handleTheme(request("dark")));

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
  });
});
