import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

/**
 * FSD 아키텍처 린터 설정. 규칙을 끄는 곳마다 왜 끄는지 근거를 남긴다.
 * @see https://github.com/feature-sliced/steiger
 */
export default defineConfig([
  ...fsd.configs.recommended,

  {
    // 아키텍처는 제품 코드의 성질이다. 테스트와 픽스처는 검사하지 않는다.
    ignores: ["**/*.test.ts", "**/*.test.tsx", "**/*.fixtures.ts"],
  },

  {
    /**
     * Next.js는 `app`과 `pages`를 라우팅 폴더로 예약해 두었다. 그래서 FSD의 두 레이어는
     * 공식 Next.js 가이드가 권하는 대로 `_app`·`_pages`로 이름을 바꿔 두었다.
     * steiger는 아직 이 접두어를 모르고 오타로 본다.
     * @see https://feature-sliced.design/docs/guides/tech/with-nextjs
     */
    rules: { "fsd/typo-in-layer-name": "off" },
  },

  {
    /**
     * app 레이어는 슬라이스가 아니라 세그먼트로 이루어진다(라우트 핸들러·레이아웃·전역 스타일).
     * 위에서 typo 규칙을 껐기 때문에 steiger가 `_app`을 app 레이어로 알아보지 못하고
     * 그 세그먼트들을 "세그먼트 없는 슬라이스"로 오해한다.
     * @see https://feature-sliced.design/docs/reference/layers#layers
     */
    files: ["./src/_app/**"],
    rules: { "fsd/no-segmentless-slices": "off" },
  },

  {
    /**
     * shared의 ui·lib는 배럴 하나로 묶지 않고 `@/shared/ui/banner` 처럼 모듈별 공개 API로
     * 가져온다. 공식 문서가 트리셰이킹을 위해 권하는 방식이다.
     * @see https://feature-sliced.design/docs/reference/public-api#pitfall-worse-tree-shaking
     */
    files: ["./src/shared/**"],
    rules: { "fsd/public-api": "off" },
  },

  {
    /**
     * pull-request는 지금 대시보드 한 곳에서만 쓰이지만, GitHub의 PR 응답을 우리 도메인
     * 모양으로 옮기는 자리다. 이 변환을 화면 슬라이스로 옮기면 대시보드가 레이아웃과
     * GraphQL 쿼리를 동시에 들게 된다. 경계를 유지하는 쪽이 낫다고 판단해 예외를 둔다.
     */
    files: ["./src/entities/pull-request/**"],
    rules: { "fsd/insignificant-slice": "off" },
  },
]);
