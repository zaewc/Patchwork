import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const typedFiles = ["**/*.{ts,tsx,mts,cts}"];
const typeChecked = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: typedFiles,
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...typeChecked,
  {
    files: typedFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 생성물 — 검사할 소스가 아니다.
    ".next-e2e/**",
    ".next-performance/**",
    ".lighthouseci/**",
    "coverage/**",
    "lighthouse-reports/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Playwright의 fixture는 `use(...)` 콜백으로 값을 넘긴다. React Hook이 아니다.
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    // Steiger 플러그인의 공개 타입이 configs.recommended를 any[]로 노출한다.
    files: ["steiger.config.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
]);

export default eslintConfig;
