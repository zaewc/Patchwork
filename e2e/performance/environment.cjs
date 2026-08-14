const APP_PORT = 3200;
const MOCK_PORT = 4020;
const APP_URL = `http://localhost:${APP_PORT}`;
const MOCK_GITHUB_URL = `http://localhost:${MOCK_PORT}`;
const SESSION_SECRET = "performance-session-secret-".padEnd(64, "0");
const AVATAR_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%232563eb'/%3E%3C/svg%3E";

const appEnv = {
  GITHUB_CLIENT_ID: "performance-client-id",
  GITHUB_CLIENT_SECRET: "performance-client-secret",
  SESSION_SECRET,
  GITHUB_OAUTH_SCOPES: "read:user,repo",
  APP_URL,
  GITHUB_GRAPHQL_URL: `${MOCK_GITHUB_URL}/graphql`,
  GITHUB_OAUTH_AUTHORIZE_URL: `${MOCK_GITHUB_URL}/login/oauth/authorize`,
  GITHUB_OAUTH_TOKEN_URL: `${MOCK_GITHUB_URL}/login/oauth/access_token`,
  DEPS_DEV_API_URL: `${MOCK_GITHUB_URL}/deps-dev/v3`,
  DEPS_DEV_REVALIDATE_SECONDS: "0",
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next-performance",
};

function sessionCookie() {
  const key = scryptSync(SESSION_SECRET, "patchwork.session.v1", 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const session = {
    token: "gho_performance_token",
    login: "octocat",
    name: "The Octocat",
    avatarUrl: AVATAR_URL,
  };
  const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

module.exports = {
  APP_PORT,
  MOCK_PORT,
  APP_URL,
  MOCK_GITHUB_URL,
  SESSION_SECRET,
  AVATAR_URL,
  appEnv,
  sessionCookie,
};
/* eslint-disable @typescript-eslint/no-require-imports -- Lighthouse CI와 공유하는 CommonJS 설정이다. */
const { createCipheriv, randomBytes, scryptSync } = require("node:crypto");
