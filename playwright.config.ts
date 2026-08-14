import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3100;
const MOCK_PORT = 4010;

export const APP_URL = `http://localhost:${APP_PORT}`;
export const MOCK_GITHUB_URL = `http://localhost:${MOCK_PORT}`;

/** 앱이 진짜 github.com 대신 mock 서버를 보게 만드는 환경변수 */
const appEnv = {
  GITHUB_CLIENT_ID: "e2e-client-id",
  GITHUB_CLIENT_SECRET: "e2e-client-secret",
  SESSION_SECRET: "e2e-session-secret-".padEnd(64, "0"),
  GITHUB_OAUTH_SCOPES: "read:user,repo",
  APP_URL,
  GITHUB_GRAPHQL_URL: `${MOCK_GITHUB_URL}/graphql`,
  GITHUB_OAUTH_AUTHORIZE_URL: `${MOCK_GITHUB_URL}/login/oauth/authorize`,
  GITHUB_OAUTH_TOKEN_URL: `${MOCK_GITHUB_URL}/login/oauth/access_token`,
};

export default defineConfig({
  testDir: "./e2e",
  // 시나리오를 mock 서버 한 곳에서 갈아끼우므로 순서대로 돌린다.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
    // 방금 빌드한 서버의 첫 요청은 느릴 수 있다.
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-github/server.mjs",
      url: `${MOCK_GITHUB_URL}/__scenario`,
      env: { MOCK_GITHUB_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
    },
    {
      // 개발 서버와 부딪히지 않도록 별도 distDir에 빌드해 프로덕션 모드로 띄운다.
      command: `npx next build && npx next start --port ${APP_PORT}`,
      url: APP_URL,
      env: { ...appEnv, NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: "ignore",
    },
  ],
});
