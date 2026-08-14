/* eslint-disable @typescript-eslint/no-require-imports -- Lighthouse CI 설정은 CommonJS로 불러온다. */
const fs = require("node:fs");
const environment = require("./e2e/performance/environment.cjs");

const { APP_URL, sessionCookie } = environment;

const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

module.exports = {
  ci: {
    collect: {
      url: [`${APP_URL}/dashboard`, `${APP_URL}/export`],
      numberOfRuns: 5,
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
        "categories:performance": ["error", { minScore: 0.7, aggregationMethod: "median" }],
        "first-contentful-paint": [
          "error",
          { maxNumericValue: 2_500, aggregationMethod: "median" },
        ],
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 8_000, aggregationMethod: "median" },
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
          { maxNumericValue: 200_000, aggregationMethod: "median" },
        ],
        "resource-summary:font:size": [
          "error",
          { maxNumericValue: 2_400_000, aggregationMethod: "median" },
        ],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 2_700_000, aggregationMethod: "median" },
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
