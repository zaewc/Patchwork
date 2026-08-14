import { beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "GITHUB_GRAPHQL_URL",
  "GITHUB_OAUTH_AUTHORIZE_URL",
  "GITHUB_OAUTH_TOKEN_URL",
] as const;

/** 주소는 모듈을 읽는 시점에 정해지므로 환경변수를 바꾼 뒤 다시 불러야 한다. */
async function loadConfig(env: Partial<Record<(typeof KEYS)[number], string>> = {}) {
  vi.resetModules();
  for (const key of KEYS) vi.stubEnv(key, env[key]);
  return import("@/lib/config");
}

beforeEach(() => {
  vi.resetModules();
});

describe("GitHub 주소", () => {
  it("환경변수가 없으면 github.com을 쓴다", async () => {
    const config = await loadConfig();

    expect(config.GITHUB_GRAPHQL_URL).toBe("https://api.github.com/graphql");
    expect(config.GITHUB_OAUTH_AUTHORIZE_URL).toBe("https://github.com/login/oauth/authorize");
    expect(config.GITHUB_OAUTH_TOKEN_URL).toBe("https://github.com/login/oauth/access_token");
  });

  it("환경변수로 다른 서버를 물릴 수 있다", async () => {
    const config = await loadConfig({
      GITHUB_GRAPHQL_URL: "http://localhost:4010/graphql",
      GITHUB_OAUTH_AUTHORIZE_URL: "http://localhost:4010/login/oauth/authorize",
      GITHUB_OAUTH_TOKEN_URL: "http://localhost:4010/login/oauth/access_token",
    });

    expect(config.GITHUB_GRAPHQL_URL).toBe("http://localhost:4010/graphql");
    expect(config.GITHUB_OAUTH_AUTHORIZE_URL).toBe("http://localhost:4010/login/oauth/authorize");
    expect(config.GITHUB_OAUTH_TOKEN_URL).toBe("http://localhost:4010/login/oauth/access_token");
  });
});
