import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 생성물 — 검사할 소스가 아니다.
    ".next-e2e/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Playwright의 fixture는 `use(...)` 콜백으로 값을 넘긴다. React Hook이 아니다.
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
]);

export default eslintConfig;
