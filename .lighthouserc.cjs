/* eslint-disable @typescript-eslint/no-require-imports -- Lighthouse CI 설정은 CommonJS로 불러온다. */
const fs = require("node:fs");
const environment = require("./e2e/performance/environment.cjs");

const { APP_URL, sessionCookie } = environment;

const macChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

module.exports = {
  ci: {
    collect: {
      url: [`${APP_URL}/dashboard`, `${APP_URL}/export`],
      numberOfRuns: 5,
      startServerCommand: "node e2e/performance/server.mjs",
      startServerReadyPattern: "\\[performance\\] servers ready",
      startServerReadyTimeout: 30_000,
      chromePath:
        process.env.CHROME_PATH ??
        (fs.existsSync(macChrome) ? macChrome : undefined),
      settings: {
        extraHeaders: { Cookie: `pw_session=${sessionCookie()}` },
      },
    },
    assert: {
      assertions: {
        "categories:performance": [
          "error",
          { minScore: 0.95, aggregationMethod: "median" },
        ],
        "first-contentful-paint": [
          "error",
          { maxNumericValue: 2_000, aggregationMethod: "median" },
        ],
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 3_000, aggregationMethod: "median" },
        ],
        "total-blocking-time": [
          "error",
          { maxNumericValue: 150, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": [
          "error",
          { maxNumericValue: 0.01, aggregationMethod: "median" },
        ],
        "resource-summary:script:size": [
          "error",
          { maxNumericValue: 170_000, aggregationMethod: "median" },
        ],
        "resource-summary:font:size": [
          "error",
          { maxNumericValue: 90_000, aggregationMethod: "median" },
        ],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 280_000, aggregationMethod: "median" },
        ],
        "resource-summary:third-party:size": [
          "error",
          { maxNumericValue: 0, aggregationMethod: "median" },
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
