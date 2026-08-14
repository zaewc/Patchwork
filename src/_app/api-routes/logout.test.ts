import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleLogout } from "@/_app/api-routes/logout";
import { STATE_COOKIE } from "@/_app/api-routes/oauth-state";
import { SESSION_COOKIE } from "@/entities/viewer";

const request = (url = "http://localhost:3000/api/auth/logout") => new Request(url);

beforeEach(() => {
  vi.stubEnv("APP_URL", undefined);
});

describe.each([["POST"], ["GET"]])("%s /api/auth/logout", () => {
  const handler = handleLogout;
  it("홈으로 되돌린다", async () => {
    const response = await handler(request());

    // 303이라야 브라우저가 POST를 GET으로 바꿔 따라간다.
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("세션과 state 쿠키를 모두 지운다", async () => {
    const response = await handler(request());

    for (const name of [SESSION_COOKIE, STATE_COOKIE]) {
      // 지운 쿠키는 값이 비고 유효기간이 epoch으로 돌아간다.
      expect(response.cookies.get(name)).toMatchObject({ value: "", expires: new Date(0) });
    }
  });

  it("APP_URL이 있으면 그 주소로 되돌린다", async () => {
    vi.stubEnv("APP_URL", "https://patchwork.example.com/");

    const response = await handler(request());
    expect(response.headers.get("location")).toBe("https://patchwork.example.com/");
  });
});
