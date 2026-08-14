/* eslint-disable @typescript-eslint/no-require-imports -- Lighthouse CI 설정은 CommonJS로 불러온다. */
const { createCipheriv, randomBytes, scryptSync } = require("node:crypto");
const fs = require("node:fs");
const environment = require("./e2e/performance/environment.cjs");

const { APP_URL, SESSION_SECRET, AVATAR_URL } = environment;

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

const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

module.exports = {
  ci: {
    collect: {
      url: [`${APP_URL}/dashboard`, `${APP_URL}/export`],
      numberOfRuns: 3,
      startServerCommand: "node e2e/performance/server.mjs",
      startServerReadyPattern: "\\[performance\\] servers ready",
      startServerReadyTimeout: 30_000,
      chromePath: process.env.CHROME_PATH ?? (fs.existsSync(macChrome) ? macChrome : undefined),
      settings: {
        extraHeaders: { Cookie: `pw_session=${sessionCookie()}` },
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8, aggregationMethod: "median" }],
        "first-contentful-paint": [
          "error",
          { maxNumericValue: 2_500, aggregationMethod: "median" },
        ],
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 3_000, aggregationMethod: "median" },
        ],
        "total-blocking-time": [
          "error",
          { maxNumericValue: 500, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": [
          "error",
          { maxNumericValue: 0.1, aggregationMethod: "median" },
        ],
        "resource-summary:script:size": [
          "error",
          { maxNumericValue: 350_000, aggregationMethod: "median" },
        ],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 600_000, aggregationMethod: "median" },
        ],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "lighthouse-reports",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
