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
- 렌더 중에 `Date.now()` 같은 비순수 함수를 부르지 않습니다. 데이터 로딩 함수 쪽으로 옮기세요 (`_pages/readme-export/api/loadContributionItems.ts` 참고).
- 데이터 읽기는 두 단계입니다. `entities/*/api`는 바깥에 한 가지를 묻고, `_pages/*/api`는 그 결과를 한 화면 분량으로 조립하며 부분 실패를 어떻게 다룰지 정합니다.
- **repository 점수(`impact`)는 GitHub 응답을 옮기는 자리에서 매기지 않습니다.** deps.dev의 OpenSSF Scorecard를 받아야 알 수 있으므로 `Unscored<T>`로 꼬리표만 달아 두고, 화면 로더가 `loadScorecards` → `withImpact`로 완성합니다. 화면 한 번에 조회 한 번입니다.
- deps.dev 조회는 곁가지입니다. 실패하면 점수 없이 진행하고 화면은 그대로 그립니다. 이 성질을 깨지 마세요.

### 문구와 언어

한국어·영어·일본어·러시아어 네 벌입니다. 요청마다 `pw_locale` 쿠키를 먼저 보고, 없으면 `Accept-Language`를 따르며, 그래도 모르면 한국어입니다. 주소는 언어와 무관합니다 — 헤더의 전환 버튼이 쿠키만 갈아끼우고 `Referer`로 되돌리므로 보던 조회 조건이 그대로 남습니다.

#### 자리가 셋입니다

```text
shared/config/locale.ts     어떤 언어를 아는가 — LOCALES · LOCALE_NAMES · 쿠키 · 헤더 맞추기
shared/lib/i18n             문구의 모양 — Dictionary 타입 · interpolate       (클라이언트도 가져옴)
shared/lib/i18n-server      사전 데이터 ko·en · getDictionary()               (서버 전용)
```

**`i18n`과 `i18n-server`를 합치지 마세요.** `i18n-server`는 아는 언어 수만큼 문구를 지고 있어 브라우저로 넘어가면 안 됩니다. 공개 API에 `next/headers`를 쓰는 `getDictionary`가 들어 있으므로, 클라이언트 컴포넌트가 이 모듈을 가져오면 빌드가 그 자리에서 깨집니다. 규율이 아니라 빌드가 막습니다.

같은 이유로 `shared/api`·`entities/*/api`는 사전을 **직접 읽지 않습니다.** 배럴(`entities/pull-request/index.ts`)을 타고 `next/headers`가 브라우저 번들까지 딸려 가기 때문입니다. `githubGraphQL`은 실패 문구(`GitHubMessages`)를 인자로 받습니다. 사전을 읽는 곳은 화면(`_pages/*`)과 `_app`(레이아웃·라우트 핸들러)뿐이고, 나머지는 `dict`를 prop으로 받습니다.

#### 로케일 하나 더 넣기

1. `shared/config/locale.ts`의 `LOCALES`에 코드를, `LOCALE_LABELS`에 **그 언어로 적은 이름**과 국기를 더합니다. `ko`처럼 언어만 적어도 되고 `pt-BR`·`zh-TW`처럼 지역까지 갈라도 됩니다.
2. `shared/lib/i18n-server/`에 `en.ts`를 복사해 새 파일을 만들고 `locale`·`numberLocale`·`time.locale`을 그 언어의 BCP 47 태그로 고칩니다.
3. `dictionaryOf.ts`의 `DICTIONARIES`에 한 줄 더합니다.
4. 국기 SVG를 [flag-icons](https://github.com/lipis/flag-icons)(MIT)의 `flags/4x3/`에서 받아 `public/flags/<소문자코드>.svg`로 둡니다.
5. `npm run test:all`.

1·3을 빠뜨리면 타입 검사가 잡고, 4를 빠뜨리면 `LocaleSwitch.test.tsx`가 잡습니다(빠진 국기는 화면에서 빈칸으로만 보여 눈으로는 놓치기 쉽습니다). 번역을 흘리면 `dictionaryOf.test.ts`가 잡습니다 — 키가 맞는지, `{이름}` 자리가 맞는지, 다른 언어와 글자가 똑같은 자리가 남았는지를 **아는 언어 전부에 대해** 봅니다. 화면 코드와 `LocaleSwitch`는 손대지 않습니다.

#### 지키는 것들

- **사전 값은 전부 문자열입니다.** 서버 컴포넌트가 `dict`를 클라이언트 컴포넌트로 그대로 넘기므로 함수는 직렬화되지 않습니다. 값이 끼어드는 자리는 `{이름}`으로 비우고 `interpolate`가 채웁니다.
- **언어마다 달라지는 문구만 넣습니다.** `Contributions`·`Repositories`·`Less`/`More`·`Mon`처럼 원래부터 영어인 골격 라벨은 컴포넌트에 그대로 둡니다.
- **언어 이름은 사전에 넣지 않습니다.** `한국어`·`English`는 어느 언어로 보든 같아야 하므로 `LOCALE_LABELS` 한 벌뿐입니다.
- **국기는 곁다리입니다.** 나라이지 언어가 아니라서(영어 US/GB, 스페인어 ES/MX, 아랍어 22개국) 뜻은 늘 이름이 집니다. 스크린 리더에는 `aria-hidden`으로 감추고, 국기 없이 이름만으로도 고를 수 있게 둡니다. 나라를 못 고르겠는 언어가 들어오면 `LOCALE_LABELS`의 `countryCode`를 통째로 지우는 것이 답입니다.
- 국기는 [`react-country-flag`](https://github.com/danalloway/react-country-flag)가 `svg` 모드로 그립니다. 이모지 국기는 Windows에 글꼴이 없어 `KR` 같은 글자로 떨어지기 때문입니다. **그림은 `public/flags/`에서 우리가 직접 냅니다.** 패키지 기본값인 jsdelivr를 쓰면 바깥에서 받아 오는 자원이 생기는데, 이 앱은 그런 것이 하나도 없다는 것을 성능 예산 `resource-summary:third-party:size` 0으로 지켜 오고 있습니다(성능 하네스가 아바타까지 `data:` URI로 바꿔 두는 이유이기도 합니다).
- `shared/ui`는 업무 지식도 언어도 들지 않습니다. 문구는 `label` 같은 props로 받습니다.
- 시간·숫자는 사전에 적지 않고 `Intl`에 맡깁니다. 사전은 `time.locale`·`numberLocale` 같은 태그만 들고 있습니다.

테스트는 `vitest.setup.ts`가 빈 `next/headers`를 깔아 두어 기본이 한국어입니다. 언어를 직접 다루는 테스트만 파일에서 다시 `vi.mock` 합니다.

#### 아직 하지 않은 것

- **RTL(아랍어·히브리어)은 준비되어 있지 않습니다.** `<html dir>`도, 논리 속성(`ps-*` `text-start` `inset-inline-start`)도 쓰지 않습니다. 지금은 `pl-9`·`text-right`·`style={{ left }}` 같은 물리 속성이라, RTL 언어를 넣으려면 그 전환이 먼저입니다.

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

## 이름

이름 하나에 형식 하나입니다. 고민할 자리를 없애려고 정한 것이므로 파일마다 다시 정하지 마세요.

| 대상                         | 형식           | 예                                       |
| ---------------------------- | -------------- | ---------------------------------------- |
| 디렉토리                     | kebab-case     | `contribution-scope/` · `copy-button/`   |
| `.tsx` 파일                  | PascalCase     | `ScopeTabs.tsx` · `TabBar.tsx`           |
| `.ts` 파일                   | lowerCamelCase | `loadScorecards.ts` · `filterByScope.ts` |
| 타입 · 인터페이스 · 컴포넌트 | PascalCase     | `ScopeParams` · `TabBar`                 |
| 변수 · 함수                  | lowerCamelCase | `scopeTabGroups` · `loadScorecards`      |
| 모듈 상수                    | UPPER_CASE     | `MAX_REPOSITORIES` · `SESSION_COOKIE`    |

`npm run lint`이 검사합니다. 파일·폴더는 [check-file](https://github.com/dukeluo/eslint-plugin-check-file)이, 코드 안의 이름은 `@typescript-eslint/naming-convention`이 봅니다.

`.tsx`가 PascalCase인 것은 그 파일이 컴포넌트 하나로 완결되기 때문입니다. 파일 이름과 export 이름이 같으면 import 문에서 경로를 다시 읽지 않아도 됩니다.

예외는 규칙에 적어 두었습니다.

**우리가 짓지 않은 이름 두 자리는 규칙 밖입니다.** 둘 다 파일명이 곧 다른 무언가와 맞물리는 약속이라, 형식을 바꾸면 동작이 깨집니다.

- `app/`의 파일명은 Next의 라우팅 규약(`page` `layout` `loading` `route` …)입니다. 그 목록만 허용합니다.
- `entities/*/@x/<슬라이스>.ts`의 이름은 **참조 대상 슬라이스 폴더명 그 자체**입니다(`@x/pull-request.ts` ↔ `entities/pull-request`). steiger가 이 이름으로 교차 참조를 대조하므로 kebab-case로 둡니다. 별도 config 블록으로 분리해 두었습니다.

나머지 예외 셋:

- `_app`·`_pages`·`@x` 세 폴더는 `ignoreWords`로 빠집니다. 앞의 둘은 Next와의 충돌을 피한 접두어, `@x`는 FSD의 교차 공개 API라 kebab-case로 적을 수 없습니다.
- `ScopeTabs.test.tsx`·`dashboard.fixtures.ts`의 가운데 확장자는 이름이 아니므로 `ignoreMiddleExtensions`로 건너뜁니다.
- **바깥에서 받은 이름은 우리가 정하지 않습니다.** GitHub·deps.dev 응답의 `snake_case`가 그대로 흘러 들어오므로 객체 속성과 구조 분해 변수에는 형식을 걸지 않았습니다. 이 예외를 좁히지 마세요.

폴더는 kebab-case, 파일은 PascalCase/camelCase라 `shared/ui/copy-button/CopyButton.tsx`처럼 둘의 형식이 어긋납니다. 의도된 것입니다.

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
