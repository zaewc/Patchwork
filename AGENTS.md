<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 이 저장소의 규칙

## 구조: Feature-Sliced Design

레이어는 위에서 아래로만 의존합니다. 반대 방향은 없습니다.

```text
app/            Next.js 라우팅 — 재내보내기 한 줄씩
src/_app/       라우트 핸들러 구현 · 루트 레이아웃 · 전역 스타일
src/_pages/     화면 하나 = 슬라이스 하나 (home · dashboard · readme-export)
src/widgets/    여러 화면이 공유하는 완결된 UI 블록 (site-header)
src/features/   사용자가 하는 일 (contribution-scope)
src/entities/   도메인 개념 (repo · pull-request · contribution · viewer)
src/shared/     업무 지식이 없는 토대 (api · config · lib · ui)
```

`_app`과 `shared`는 레이어이면서 슬라이스입니다. 슬라이스로 쪼개지 않고 세그먼트(`api` `model` `ui` `lib` `config`)로만 나뉘며, 그 세그먼트끼리는 자유롭게 참조합니다.

### 이름에 손대지 마세요

FSD의 `app`·`pages` 레이어를 `_app`·`_pages`로 둔 것은 의도된 것입니다. `src/app`이 있으면 Next가 라우팅 폴더가 둘이라며 멈추고, `src/pages`가 있으면 Pages Router로 오인합니다. [공식 Next.js 가이드](https://feature-sliced.design/docs/guides/tech/with-nextjs)가 권하는 접두어입니다.

### import 규칙

- 라우팅(`app/`)에는 재내보내기 한 줄만. 로직은 `src/_pages`에 둡니다.

  ```tsx
  // app/dashboard/page.tsx
  export { DashboardPage as default } from "@/_pages/dashboard";
  ```

- 슬라이스 바깥에서는 그 슬라이스의 `index.ts`가 내보낸 것만 씁니다. 내부 경로를 직접 찌르지 마세요.
- 슬라이스 안에서는 자기 `index.ts`를 거치지 않습니다(순환 참조).
- `export *`는 쓰지 않습니다. 이름을 하나씩 적습니다.
- `shared/ui`·`shared/lib`는 모듈별 공개 API로 가져옵니다: `@/shared/ui/banner`, `@/shared/lib/format`.
  값만 있는 `shared/config`와 GitHub 클라이언트 하나로 완결된 `shared/api`는 세그먼트 단위로 묶여 있습니다.
- **같은 레이어를 참조해야 하면 `@x` 교차 공개 API를 만듭니다.** 참조를 허락하는 쪽이 누구에게 무엇을 열어 줄지 적습니다.

  ```ts
  // src/entities/repo/@x/contribution.ts  — "repo crossed with contribution"
  export { repoSignalsOf, scoreRepo } from "@/entities/repo";
  ```

  현재 두 개뿐입니다(`@x/contribution`, `@x/pull-request`). 늘어난다면 경계를 다시 그어야 한다는 신호입니다.

### 서버 컴포넌트

- 기본은 서버 컴포넌트입니다. `"use client"`는 브라우저 API가 꼭 필요할 때만 (현재 `shared/ui/copy-button` 한 곳).
- 렌더 중에 `Date.now()` 같은 비순수 함수를 부르지 않습니다. 데이터 로딩 함수 쪽으로 옮기세요 (`_pages/readme-export/api/load-contribution-items.ts` 참고).
- 데이터 읽기는 두 단계입니다. `entities/*/api`는 GitHub에 한 가지를 묻고, `_pages/*/api`는 그 결과를 한 화면 분량으로 조립하며 부분 실패를 어떻게 다룰지 정합니다.

### 새 코드를 넣을 자리

1. 화면이 늘어나는가 → `_pages`에 슬라이스 추가, `app/`에 재내보내기 한 줄
2. 사용자가 하는 새 동작이고 **여러 화면이 쓰는가** → `features`
3. **여러 화면이 쓰는** UI 블록인가 → `widgets`. 한 화면만 쓰면 그 화면의 `ui`에
4. 새 도메인 개념인가 → `entities`
5. 업무 지식이 없는 도구인가 → `shared`

블록이 커서 widget/feature인 것이 아니라 **여러 곳에서 쓰여서** 그렇습니다. 재사용되지 않는 것은 꺼내지 마세요. 고민되면 아래 레이어에서 시작해 필요할 때 올리는 편이 낫습니다.

### Steiger

`npm run lint:arch`([Steiger](https://github.com/feature-sliced/steiger), FSD 공식 린터)가 위 규칙 대부분을 검사합니다.

`steiger.config.ts`에서 끈 규칙 네 개는 파일에 근거를 적어 두었습니다. **다시 켜려 하지 마세요** — 세 개는 steiger가 `_app`·`_pages` 접두어와 모듈별 공개 API를 아직 모르기 때문이고, 나머지 하나(`insignificant-slice` on `entities/pull-request`)는 GitHub 응답을 도메인 모양으로 옮기는 경계를 화면 안에 넣지 않기로 한 판단입니다.

## 테스트

- 테스트는 대상 파일 옆에 둡니다: `impact.ts` → `impact.test.ts`. 모듈이 이사하면 테스트도 같이 갑니다.
- 커버리지 임계값은 statements·branches·functions·lines **모두 100%**입니다. 도달할 수 없는 방어 코드를 남기지 말고 지우거나, 따로 테스트할 수 있는 함수로 꺼내세요 (`shared/lib/error-message` 참고).
- 서버 컴포넌트는 `render(await Page(props))`로 부른 뒤 결과를 검사합니다.
- E2E는 `e2e/mock-github/`의 GitHub 대역 서버를 씁니다. 서버에서 나가는 fetch는 브라우저를 거치지 않아 Playwright로 가로챌 수 없어서, `shared/config/github.ts`가 주소를 환경변수로 열어 둡니다. 새 시나리오가 필요하면 `server.mjs`에 이름을 추가하고 `scenario()` fixture로 갈아끼웁니다.
- E2E는 `.next-e2e`에 따로 프로덕션 빌드해 띄웁니다. 개발 서버와 산출물이 섞이지 않습니다.
- 테스트 이름과 주석은 한국어로, "무엇을 보장하는가"를 적습니다.
- 새 코드를 넣으면 `npm run test:all`(typecheck → eslint → steiger → vitest+coverage → playwright)이 통과해야 합니다.

## 커밋

Conventional Commits(`feat:` `fix:` `refactor:` `test:` `chore:`)를 쓰고, 본문은 한국어로 **왜** 바꿨는지 적습니다.
