import { describe, expect, it, vi } from "vitest";
import { appOrigin } from "@/shared/config/app";

const request = (url: string) => new Request(url);

describe("appOrigin", () => {
  it("APP_URL이 있으면 그것을 쓴다", () => {
    vi.stubEnv("APP_URL", "https://patchwork.example.com");
    expect(appOrigin(request("http://localhost:3000/api/auth/login"))).toBe(
      "https://patchwork.example.com",
    );
  });

  it("APP_URL 끝의 슬래시는 떼어낸다", () => {
    vi.stubEnv("APP_URL", "https://patchwork.example.com/");
    expect(appOrigin(request("http://localhost:3000/"))).toBe("https://patchwork.example.com");
  });

  it("APP_URL이 없으면 요청 origin을 쓴다", () => {
    vi.stubEnv("APP_URL", undefined);
    expect(appOrigin(request("http://localhost:3000/api/auth/callback?code=1"))).toBe(
      "http://localhost:3000",
    );
  });
});
