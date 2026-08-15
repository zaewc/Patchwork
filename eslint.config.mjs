import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
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
  {
    // 이름 하나에 형식 하나. 폴더·파일은 kebab-case, 타입은 PascalCase,
    // 모듈 상수는 UPPER_CASE로 고정한다.
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "e2e/**/*.ts"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/folder-naming-convention": [
        "error",
        { "{src,app,e2e}/**/": "KEBAB_CASE" },
        // `_app`·`_pages`는 Next와의 이름 충돌을 피하려고 붙인 접두어이고,
        // `@x`는 FSD의 교차 공개 API 폴더다. 둘 다 kebab-case로 못 적는다.
        { ignoreWords: ["_app", "_pages", "@x"] },
      ],
      "check-file/filename-naming-convention": [
        "error",
        {
          // 모듈 하나가 곧 컴포넌트 하나인 `.tsx`는 그 컴포넌트 이름을 그대로 쓴다.
          "src/**/*.tsx": "PASCAL_CASE",
          "src/**/*.ts": "CAMEL_CASE",
          "e2e/**/*.ts": "CAMEL_CASE",
          // `app/`은 파일명이 곧 라우팅 규약이다(`page` `layout` `loading` `route`).
          // 우리가 고를 수 있는 이름이 아니므로 Next가 정한 이름만 허용한다.
          "app/**/*.{ts,tsx}":
            "@(page|layout|loading|error|not-found|route|template|default|global-error|sitemap|robots|manifest|opengraph-image|icon|apple-icon)",
        },
        // `ScopeTabs.test.tsx`·`dashboard.fixtures.ts`의 가운데 확장자는 이름이 아니다.
        { ignoreMiddleExtensions: true },
      ],
    },
  },
  {
    // `@x/<슬라이스>.ts`의 이름은 참조 대상 슬라이스 폴더명 그 자체다.
    // steiger가 이 이름으로 교차 참조를 대조하므로 kebab-case로 둔다.
    files: ["src/**/@x/*.ts"],
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/@x/*.ts": "KEBAB_CASE" },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        // 컴포넌트는 PascalCase, 모듈 상수 표는 UPPER_CASE, 나머지는 camelCase.
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        // 바깥에서 받은 이름(GitHub·deps.dev의 snake_case)은 우리가 정하지 않는다.
        { selector: "variable", modifiers: ["destructured"], format: null },
        { selector: ["objectLiteralProperty", "typeProperty"], format: null },
      ],
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
