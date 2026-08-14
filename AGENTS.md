<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 이 저장소의 규칙

## 구조: Feature-Sliced Design

레이어 순서는 `_app → _pages → widgets → features → entities → shared`이고, **위에서 아래로만** 의존합니다. 자세한 내용과 예외는 [ARCHITECTURE.md](ARCHITECTURE.md)를 먼저 읽으세요.

코드를 넣기 전에 확인할 것:

- 라우팅(`app/`)에는 재내보내기 한 줄만. 로직은 `src/_pages`에 둡니다.
- 슬라이스 바깥에서는 그 슬라이스의 `index.ts`가 내보낸 것만 씁니다. 내부 경로를 직접 찌르지 마세요.
- 슬라이스 안에서는 자기 `index.ts`를 거치지 않습니다(순환 참조).
- 같은 레이어를 참조해야 하면 `@x` 교차 import 공개 API를 만듭니다.
- `shared/ui`·`shared/lib`는 모듈별 공개 API(`@/shared/ui/banner`)로 가져옵니다.
- `export *`는 쓰지 않습니다. 이름을 하나씩 적습니다.
- 기본은 서버 컴포넌트입니다. `"use client"`는 브라우저 API가 꼭 필요할 때만.
- 렌더 중에 `Date.now()` 같은 비순수 함수를 부르지 않습니다. 데이터 로딩 함수 쪽으로 옮기세요.

`npm run lint:arch`(Steiger)가 위 규칙 대부분을 검사합니다.

## 테스트

- 테스트는 대상 파일 옆에 둡니다: `impact.ts` → `impact.test.ts`
- 커버리지 임계값은 statements·branches·functions·lines **모두 100%**입니다. 도달할 수 없는 방어 코드를 남기지 말고 지우거나, 따로 테스트할 수 있는 함수로 꺼내세요.
- 새 코드를 넣으면 `npm run test:all`이 통과해야 합니다.
- E2E는 `e2e/mock-github/`의 대역 서버를 씁니다. 새 시나리오가 필요하면 `server.mjs`에 시나리오 이름을 추가하고 `scenario()` fixture로 갈아끼웁니다.
- 테스트 이름과 주석은 한국어로, "무엇을 보장하는가"를 적습니다.

## 커밋

Conventional Commits(`feat:` `fix:` `refactor:` `test:` `chore:`)를 쓰고, 본문은 한국어로 **왜** 바꿨는지 적습니다.
