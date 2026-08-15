import { cookies, headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary, requestLocale } from "@/shared/lib/i18n-server";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

function request({
  cookie,
  acceptLanguage,
}: {
  cookie?: string;
  acceptLanguage?: string;
}) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "pw_locale" && cookie ? { name, value: cookie } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);

  vi.mocked(headers).mockResolvedValue({
    get: (name: string) =>
      name === "accept-language" ? (acceptLanguage ?? null) : null,
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

beforeEach(() => {
  request({});
});

describe("requestLocale", () => {
  it("골라 둔 쿠키가 있으면 그것을 쓴다", async () => {
    request({ cookie: "en", acceptLanguage: "ko-KR" });
    await expect(requestLocale()).resolves.toBe("en");
  });

  it("쿠키가 없으면 브라우저가 보낸 언어를 따른다", async () => {
    request({ acceptLanguage: "en-US,en;q=0.9" });
    await expect(requestLocale()).resolves.toBe("en");
  });

  it("쿠키가 우리가 모르는 값이면 없는 것으로 본다", async () => {
    request({ cookie: "fr", acceptLanguage: "en-US" });
    await expect(requestLocale()).resolves.toBe("en");
  });

  it("단서가 하나도 없으면 기본 언어다", async () => {
    await expect(requestLocale()).resolves.toBe("ko");
  });
});

describe("getDictionary", () => {
  it("그 요청의 언어로 된 문구 묶음을 준다", async () => {
    request({ cookie: "en" });
    await expect(getDictionary()).resolves.toMatchObject({ locale: "en" });

    request({ cookie: "ko" });
    await expect(getDictionary()).resolves.toMatchObject({ locale: "ko" });
  });
});
