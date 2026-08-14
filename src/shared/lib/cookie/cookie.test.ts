import { describe, expect, it, vi } from "vitest";
import { cookieOptions } from "@/shared/lib/cookie";

describe("cookieOptions", () => {
  it("httpOnly·lax·루트 경로로 고정한다", () => {
    expect(cookieOptions(600)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
  });

  it("production에서만 secure를 켠다", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(cookieOptions(1).secure).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(cookieOptions(1).secure).toBe(false);
  });
});
