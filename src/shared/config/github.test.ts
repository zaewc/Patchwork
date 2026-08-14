import { beforeEach, describe, expect, it, vi } from "vitest";

const URL_KEYS = [
  "GITHUB_GRAPHQL_URL",
  "GITHUB_OAUTH_AUTHORIZE_URL",
  "GITHUB_OAUTH_TOKEN_URL",
] as const;

/** 주소는 모듈을 읽는 시점에 정해지므로 환경변수를 바꾼 뒤 다시 불러야 한다. */
async function loadConfig(env: Partial<Record<(typeof URL_KEYS)[number], string>> = {}) {
  vi.resetModules();
  for (const key of URL_KEYS) vi.stubEnv(key, env[key]);
  return import("@/shared/config/github");
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

describe("oauthApp", () => {
  const stub = (id?: string, secret?: string, session?: string) => {
    vi.stubEnv("GITHUB_CLIENT_ID", id);
    vi.stubEnv("GITHUB_CLIENT_SECRET", secret);
    vi.stubEnv("SESSION_SECRET", session);
  };

  it("셋이 모두 있으면 자격증명을 준다", async () => {
    const { isOAuthConfigured, oauthApp } = await loadConfig();
    stub("client-id", "client-secret", "0".repeat(64));

    expect(oauthApp()).toEqual({ clientId: "client-id", clientSecret: "client-secret" });
    expect(isOAuthConfigured()).toBe(true);
  });

  it.each([
    ["Client ID가 없으면", undefined, "client-secret", "0".repeat(64)],
    ["Client Secret이 없으면", "client-id", undefined, "0".repeat(64)],
    ["SESSION_SECRET이 없으면", "client-id", "client-secret", undefined],
    ["빈 문자열이면", "", "client-secret", "0".repeat(64)],
  ])("%s 설정되지 않은 것으로 본다", async (_label, id, secret, session) => {
    const { isOAuthConfigured, oauthApp } = await loadConfig();
    stub(id, secret, session);

    expect(oauthApp()).toBeNull();
    expect(isOAuthConfigured()).toBe(false);
  });
});
