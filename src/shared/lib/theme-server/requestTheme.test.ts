import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";
import { requestTheme } from "@/shared/lib/theme-server";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const withCookie = (value?: string) => {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "pw_theme" && value ? { name, value } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
};

describe("requestTheme", () => {
  it("골라 둔 테마를 읽는다", async () => {
    withCookie("dark");
    await expect(requestTheme()).resolves.toBe("dark");
  });

  /** 운영체제 설정은 요청에 실려 오지 않는다. 모른다는 것을 값으로 남기고 CSS에 맡긴다. */
  it("고른 적이 없으면 system이다", async () => {
    withCookie();
    await expect(requestTheme()).resolves.toBe("system");
  });

  it("모르는 값이 담겨 있어도 system으로 떨어진다", async () => {
    withCookie("solarized");
    await expect(requestTheme()).resolves.toBe("system");
  });
});
