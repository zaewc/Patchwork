# 아키텍처

Patchwork는 [Feature-Sliced Design](https://feature-sliced.design)(FSD)을 Next.js App Router에 적용한 구조입니다. 이 문서는 **무엇이 어디에 있는지**보다 **왜 거기에 있는지**를 남깁니다. 규칙을 지키지 않은 곳도 이유와 함께 적었습니다.

## 왜 FSD인가

기능이 늘어날 때 코드가 어디로 가야 하는지 매번 다시 고민하지 않기 위해서입니다. FSD는 두 가지만 강제합니다.

1. **레이어 순서** — 위 레이어는 아래 레이어만 가져다 쓸 수 있습니다. 반대 방향은 없습니다.
2. **공개 API** — 슬라이스 바깥에서는 그 슬라이스의 `index.ts`가 내보낸 것만 볼 수 있습니다.

이 둘만 지키면 "이 파일을 고치면 무엇이 깨지는가"가 폴더 구조에서 바로 읽힙니다.

## 레이어 지도

위에서 아래로만 의존합니다. 화살표는 "가져다 쓴다"는 뜻입니다.

```
app/                    Next.js 라우팅 — 재내보내기 한 줄씩
  │
  ▼
src/_app/               라우트 핸들러 구현 · 루트 레이아웃 · 전역 스타일
  │
  ▼
src/_pages/             화면 하나 = 슬라이스 하나 (home · dashboard · readme-export)
  │
  ▼
src/widgets/            여러 화면이 공유하는 완결된 UI 블록 (site-header)
  │
  ▼
src/features/           사용자가 하는 일 (contribution-scope)
  │
  ▼
src/entities/           도메인 개념 (repo · pull-request · contribution · viewer)
  │
  ▼
src/shared/             업무 지식이 없는 토대 (api · config · lib · ui)
```

`_app`과 `shared`는 레이어이면서 동시에 슬라이스입니다. 즉 이 둘은 슬라이스로 쪼개지 않고 세그먼트(`api` · `model` · `ui` · `lib` · `config`)로만 나뉘며, 그 세그먼트끼리는 자유롭게 참조할 수 있습니다. ([레이어 문서](https://feature-sliced.design/docs/reference/layers))

## Next.js와 맞물리는 지점

### 라우팅 폴더는 프로젝트 루트에

FSD 코드는 전부 `src/`에, Next.js가 예약한 라우팅 폴더는 루트 `app/`에 둡니다. 라우트 파일은 한 줄입니다.

```tsx
// app/dashboard/page.tsx
export { DashboardPage as default } from "@/_pages/dashboard";
```

```ts
// app/api/auth/login/route.ts
export const dynamic = "force-dynamic";

export { handleLogin as GET } from "@/_app/api-routes/login";
```

라우팅은 "어떤 URL이 어떤 화면인가"만 말하고, 화면이 무엇을 하는지는 `_pages`가 압니다. 폴더 구조를 바꿔도 화면 코드는 움직이지 않습니다.

### `app` · `pages` 대신 `_app` · `_pages`

Next.js가 `app`과 `pages`라는 이름을 라우팅에 쓰기 때문에 FSD의 같은 이름 레이어와 부딪칩니다. `src/app`이 있으면 Next가 라우팅 폴더가 둘이라며 멈추고, `src/pages`가 있으면 Pages Router로 오인합니다.

공식 Next.js 가이드가 권하는 대로 접두어를 붙여 `_app` · `_pages`로 두었습니다. ([Next.js 사용 가이드](https://feature-sliced.design/docs/guides/tech/with-nextjs))

### 데이터는 서버에서 읽는다

모든 화면은 서버 컴포넌트입니다. `"use client"`는 브라우저 API가 꼭 필요한 한 곳(`shared/ui/copy-button`)에만 있습니다.

읽기는 두 단계로 나뉩니다.

- **`entities/*/api`** — GitHub에 한 가지를 묻는 일. `fetchContributions`, `fetchPullRequests`, `fetchContributionItems`.
- **`_pages/*/api`** — 그 결과를 한 화면 분량으로 조립하는 일. `loadDashboard`는 조회 창 5개와 PR 검색을 동시에 띄우고, 일부만 실패했을 때 무엇을 포기하고 무엇을 살릴지 정합니다.

경계를 이렇게 그은 덕에 "GitHub에 무엇을 묻는가"와 "실패를 어떻게 다룰 것인가"를 따로 테스트할 수 있습니다.

## 슬라이스마다 내린 판단

### entities

| 슬라이스 | 무엇 | 왜 여기 |
| --- | --- | --- |
| `repo` | 권위 점수(`impact`) · `RepoStat` · 로고 | 기여를 "얼마나 중요한 곳에 했는가"로 읽는 이 앱의 중심 개념 |
| `pull-request` | PR 응답 → 화면 모양 변환 · 검토 상태 분류 · 카드/줄 UI | GitHub의 PR 모양이 우리 모양으로 바뀌는 자리 |
| `contribution` | 달력 병합 · repository별 집계 · 기여 목록 검색 | 창 여러 개에 걸친 기여를 하나로 잇는 규칙이 사는 곳 |
| `viewer` | 세션 봉인/해제 · 토큰 주인 확인 | 로그인한 사람에 대한 모든 것 |

### features가 하나뿐인 이유

FSD 문서는 *"모든 것이 feature일 필요는 없다. 여러 화면이 쓸 때만 꺼내라"* 고 말합니다. 이 앱에서 그 조건을 만족하는 것은 하나입니다.

`features/contribution-scope`는 "주요 OSS만 볼지 전체를 볼지"와 "얼마 동안의 기여를 볼지"를 담당하고, 대시보드와 README 내보내기 두 화면이 함께 씁니다. 리팩토링 전에는 두 화면이 같은 탭 묶음과 같은 필터 조건을 각각 베껴 쓰고 있었습니다.

- `model/params.ts` — URL 쿼리스트링을 읽고 쓰는 유일한 곳
- `lib/filter-by-scope.ts` — 세 목록이 어긋나지 않도록 같은 기준으로 거른다
- `ui/scope-tabs.tsx` — 두 화면이 공유하는 탭

### widgets가 하나뿐인 이유

같은 문서가 *"재사용되지 않는 UI 블록은 widget으로 만들지 말라"* 고 합니다. 네 화면이 모두 쓰는 `site-header`만 widget이고, 대시보드에만 나오는 기여 달력·repository 표·PR 보드는 `_pages/dashboard/ui`에 둡니다.

블록이 커서 widget인 것이 아니라, **여러 곳에서 쓰여서** widget입니다.

## 같은 레이어끼리 필요할 때: `@x`

`entities/contribution`은 기여를 repository별로 합치면서 그 repository의 권위 점수를 매겨야 합니다. 둘 다 entities 레이어라 원래는 서로 못 봅니다.

FSD는 이런 의도된 결합을 숨기지 말고 드러내라고 합니다. 참조를 허락하는 쪽이 **누구에게 무엇을 열어 줄지** 따로 적습니다.

```ts
// src/entities/repo/@x/contribution.ts
export { repoSignalsOf, scoreRepo, REPO_COUNT_FIELDS } from "@/entities/repo";
export type { RepoCountField, RepoStat } from "@/entities/repo";
```

```ts
// src/entities/contribution/lib/aggregate-repos.ts
import { scoreRepo } from "@/entities/repo/@x/contribution";
```

"repo crossed with contribution"이라고 읽습니다. 이 앱에는 두 개뿐이며(`@x/contribution`, `@x/pull-request`), 늘어난다면 경계를 다시 그어야 한다는 신호입니다. ([교차 import 문서](https://feature-sliced.design/docs/reference/public-api#cross-imports))

## 공개 API를 어떻게 열었나

슬라이스는 `index.ts` 하나로 열고, 이름을 하나하나 적습니다. `export *`는 쓰지 않습니다 — 무엇이 공개인지 읽을 수 없고, 내부 구현이 실수로 새어 나갑니다.

```ts
// src/entities/repo/index.ts
export { RepoLogo } from "@/entities/repo/ui/repo-logo";
export { isNotable, scoreRepo, MIN_STARS, NOTABLE_MIN, WEIGHTS } from "@/entities/repo/model/impact";
```

`shared`는 다릅니다. 세그먼트 전체를 배럴 하나로 묶으면 버튼 하나를 가져오려다 UI 키트 전체를 번들에 끌고 옵니다. 공식 문서가 권하는 대로 **모듈별 공개 API**를 둡니다.

```
src/shared/ui/banner/index.ts        →  @/shared/ui/banner
src/shared/lib/format/index.ts       →  @/shared/lib/format
```

값만 들어 있어 끌려올 것이 없는 `shared/config`와, GitHub 클라이언트 하나로 완결된 `shared/api`는 세그먼트 단위로 묶었습니다.

슬라이스 안에서는 자기 `index.ts`를 거치지 않습니다. 순환 참조가 생깁니다. ([공개 API 문서](https://feature-sliced.design/docs/reference/public-api))

## 규칙을 기계가 지킨다

구조는 문서가 아니라 CI가 지켜야 유지됩니다.

```bash
npm run typecheck      # tsc
npm run lint           # eslint (Next.js core-web-vitals + typescript)
npm run lint:arch      # steiger — FSD 레이어·공개 API 위반
npm run test:coverage   # vitest, 4개 지표 100% 미만이면 실패
npm run test:e2e       # playwright
npm run test:all       # 위 전부
```

[Steiger](https://github.com/feature-sliced/steiger)는 FSD 공식 아키텍처 린터입니다. 상위 레이어를 거꾸로 참조하거나, 공개 API를 우회하거나, 슬라이스를 과하게 쪼개면 잡아냅니다.

`steiger.config.ts`에서 끈 규칙은 네 개이고, 각각 왜 끄는지 파일에 적어 두었습니다. 요약하면:

- `typo-in-layer-name` — steiger가 아직 `_app` · `_pages` 접두어를 모릅니다.
- `no-segmentless-slices` (`_app`만) — 위 규칙을 끈 탓에 app 레이어의 세그먼트를 슬라이스로 오해합니다.
- `public-api` (`shared`만) — 모듈별 공개 API를 쓰기 때문입니다(위 참조).
- `insignificant-slice` (`entities/pull-request`만) — 지금은 대시보드 한 곳만 쓰지만, GitHub 응답을 도메인 모양으로 옮기는 경계를 화면 안으로 넣지 않기로 했습니다.

## 테스트를 어디에 두었나

테스트는 대상 파일 옆에 둡니다. 모듈이 이사하면 테스트도 같이 갑니다.

```
src/entities/repo/model/impact.ts
src/entities/repo/model/impact.test.ts
```

- **unit / component** — Vitest + Testing Library. 서버 컴포넌트는 `await Page(props)`로 부른 뒤 결과를 렌더합니다.
- **E2E** — Playwright. GitHub 대역([`e2e/mock-github`](e2e/mock-github/server.mjs))을 띄우고 `GITHUB_GRAPHQL_URL` 등을 그쪽으로 돌립니다. 서버에서 나가는 fetch는 브라우저를 거치지 않아 Playwright의 요청 가로채기로는 잡히지 않기 때문입니다. 그래서 `shared/config/github.ts`가 주소를 환경변수로 열어 둡니다 — 테스트를 위한 구멍이면서, GitHub Enterprise를 붙일 자리이기도 합니다.

E2E는 `.next-e2e`에 따로 빌드해 프로덕션 모드로 띄웁니다. 개발 서버와 산출물이 섞이지 않고, 개발 서버를 끄지 않아도 됩니다.

## 새 기능을 넣을 자리 찾기

1. 화면 하나가 늘어나는가 → `_pages`에 슬라이스 추가, `app/`에 재내보내기 한 줄
2. 사용자가 하는 새 동작인가 → `features`
3. 여러 화면이 쓰는 UI 블록인가 → `widgets`. 한 화면만 쓰면 그 화면의 `ui`에
4. 새 도메인 개념인가 → `entities`
5. 업무 지식이 없는 도구인가 → `shared`

고민되면 아래에서 시작해 필요할 때 위로 올리는 편이 낫습니다. 반대 방향(위에서 아래로 내리기)이 언제나 더 비쌉니다.
