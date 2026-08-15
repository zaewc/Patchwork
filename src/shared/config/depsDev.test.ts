import { beforeEach, describe, expect, it, vi } from "vitest";

/** 설정은 모듈을 읽는 시점에 정해지므로 환경변수를 바꾼 뒤 다시 불러야 한다. */
async function loadConfig(env: { url?: string; revalidate?: string } = {}) {
  vi.resetModules();
  vi.stubEnv("DEPS_DEV_API_URL", env.url);
  vi.stubEnv("DEPS_DEV_REVALIDATE_SECONDS", env.revalidate);
  return import("@/shared/config/depsDev");
}

beforeEach(() => {
  vi.resetModules();
});

describe("deps.dev 설정", () => {
  it("환경변수가 없으면 공개 API를 쓴다", async () => {
    const config = await loadConfig();
    expect(config.DEPS_DEV_API_URL).toBe("https://api.deps.dev/v3");
  });

  it("환경변수로 다른 서버를 물릴 수 있다", async () => {
    const config = await loadConfig({
      url: "http://localhost:4010/deps-dev/v3",
    });
    expect(config.DEPS_DEV_API_URL).toBe("http://localhost:4010/deps-dev/v3");
  });

  it("deps.dev가 정한 캐시 수명과 같은 값을 쓴다", async () => {
    const config = await loadConfig();
    expect(config.DEPS_DEV_REVALIDATE_SECONDS).toBe(3600);
  });

  it("캐시를 끄고 매번 새로 물을 수 있다", async () => {
    const config = await loadConfig({ revalidate: "0" });
    expect(config.DEPS_DEV_REVALIDATE_SECONDS).toBe(0);
  });
});
