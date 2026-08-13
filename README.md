# Patchwork

오픈소스 기여 트래커. GitHub 기여 내역과 진행 중인 PR 상태를 한 화면에 모아 보여줍니다.

흩어진 커밋·PR·리뷰·이슈를 조각보(patchwork)처럼 이어 붙여, **내 저장소가 아닌 곳에 얼마나 기여했는지**를 중심으로 보여주는 것이 목표입니다.

## 기능

- **기여 조각보** — 일별 기여량 히트맵, 연속 기여 스트릭(현재/최장)
- **외부 저장소 분리 집계** — 내 소유 저장소와 남의 저장소 기여를 나눠서 계산, 외부 기여 비율 표시
- **저장소 권위 등급** — 토이 프로젝트 커밋과 주요 OSS 패치를 구분 ([아래](#저장소-권위-등급) 참고)
- **PR 상태 보드** — 열린 PR을 `변경 요청됨 / 리뷰 대기 / 승인됨 / 초안` 으로 분류, CI 상태와 리뷰·댓글 수 표시, 2주 이상 업데이트 없는 PR은 `정체됨` 배지
- **저장소별 기여** — 커밋/PR/리뷰/이슈를 저장소 단위로 합산해 정렬
- **기간 전환** — 최근 30일 / 90일 / 1년
- **최근 머지된 PR** 목록

## 저장소 권위 등급

기여 건수만 세면 별 3개짜리 토이 프로젝트 커밋과 널리 쓰이는 프로젝트의 패치가 같은 무게로 잡힙니다. Patchwork는 저장소마다 0~100점의 추정 점수를 매겨 네 등급으로 나눕니다 ([src/lib/impact.ts](src/lib/impact.ts)).

| 등급 | 점수 | 의미 |
| --- | --- | --- |
| 대표 OSS | 75+ | 생태계의 중심이 되는 프로젝트 |
| 주요 OSS | 55–74 | 조직이 운영하는 널리 쓰이는 프로젝트 |
| 커뮤니티 | 38–54 | 여러 사람이 함께 유지보수하는 프로젝트 |
| 개인·소규모 | 0–37 | 소수가 관리하는 프로젝트 |

점수 구성:

| 신호 | 배점 | 이유 |
| --- | --- | --- |
| 스타 수 (로그 스케일) | 40 | 규모. 다만 이것만 보면 1인 인기 프로젝트를 걸러낼 수 없다 |
| 포크 수 (로그 스케일) | 20 | 참여 폭 — 혼자 만든 것과 여럿이 손대는 것을 가른다 |
| 조직 소유 | 12 | 개인 계정이 아닌 org 소유 |
| 성숙도 (라이선스·업력) | 16 | 실제로 배포되어 쓰이는지 |
| 활성도 (최근 푸시) | 12 | 지금도 살아 있는지 |
| 포크 / 보관됨 | −25 / −20 | 포크는 상류의 명성을 물려받고, 보관된 저장소는 더 이상 중심이 아니다 |

비공개 저장소는 공개 생태계의 권위 척도 대상이 아니므로 0점으로 둡니다.

GitHub GraphQL에는 contributor count가 없습니다. `mentionableUsers.totalCount` 가 참여 폭에 더 가깝지만, 저장소마다 사용자를 세느라 집계 쿼리 전체를 타임아웃(502)시켜서 스칼라 필드인 `forkCount` 를 대용치로 씁니다. 신호는 전부 기존 응답에 필드만 추가해 계산하므로 API 요청 수는 늘지 않습니다.

어디까지나 휴리스틱입니다. 가중치와 등급 경계는 `src/lib/impact.ts` 의 `WEIGHTS`, `TIERS` 에서 바로 조정할 수 있습니다. 더 엄밀한 지표가 필요하면 [deps.dev](https://deps.dev) 의 OpenSSF Criticality Score / Scorecard 를 연동하는 방법도 있습니다(패키지로 배포된 저장소만 커버되고, 저장소당 외부 API 호출이 추가됩니다).

## 시작하기

### 1. GitHub OAuth 앱 만들기

GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App

| 항목 | 값 |
| --- | --- |
| Application name | Patchwork |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback` |

Client ID와 Client Secret을 발급받아 둡니다.

### 2. 환경변수 설정

```bash
cp .env.example .env.local
openssl rand -hex 32   # SESSION_SECRET 값으로 사용
```

`.env.local` 에 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET` 을 채웁니다.

### 3. 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 GitHub 계정으로 로그인합니다.

## 스코프에 대해

기본 스코프는 `read:user` 하나입니다. 공개 저장소 기여와 공개 PR만 집계합니다.

비공개 저장소의 기여 내역과 PR까지 보고 싶다면 `.env.local` 에 아래를 추가하세요.

```
GITHUB_OAUTH_SCOPES=read:user,repo
```

`repo` 는 비공개 저장소에 대한 읽기·쓰기 권한을 모두 포함하는 넓은 스코프입니다. 필요할 때만 켜세요.

## 구조

```
src/
  app/
    page.tsx                  랜딩 + 로그인
    dashboard/page.tsx        대시보드 (서버 컴포넌트에서 데이터 조회)
    api/auth/{login,callback,logout}/route.ts   OAuth 플로우
  lib/
    github.ts                 GraphQL 쿼리 · 집계 · 스트릭 계산
    session.ts                AES-256-GCM 암호화 세션 쿠키
    format.ts                 날짜/숫자 포맷
  components/                 조각보, PR 보드, 저장소 표 등
```

### 세션 처리

액세스 토큰은 `SESSION_SECRET` 에서 파생한 키로 AES-256-GCM 암호화한 뒤 `httpOnly` 쿠키에 담습니다(30일). 서버 사이드 저장소는 쓰지 않으며, 토큰이 클라이언트 JS에 노출되지 않습니다. OAuth `state` 는 별도의 단명 쿠키로 검증합니다.

### 데이터 조회

모든 데이터는 요청 시점에 GitHub GraphQL API에서 가져옵니다(캐시 없음). 대시보드 1회 렌더에 GraphQL 요청 2건을 사용합니다.

- `contributionsCollection` — 기간별 기여 합계, 캘린더, 저장소별 분류
- `search(type: ISSUE)` — 열린 PR과 머지된 PR

GitHub의 `contributionsCollection` 은 최대 1년 범위만 조회할 수 있어, 기간 옵션의 상한도 1년입니다.

### 502 Bad Gateway 가 뜬다면

GitHub GraphQL은 쿼리가 내부 제한 시간을 넘기면 JSON 에러 대신 프록시의 502/504 HTML을 돌려줍니다. 저장소 신호를 붙일수록 집계 쿼리가 무거워지므로 다음을 지켰습니다.

- 저장소 조각(`RepoCore`)에는 커넥션 `totalCount` 를 넣지 않습니다. `mentionableUsers`, `releases` 같은 필드 하나가 저장소 수십 개를 순회하면서 쿼리 전체를 타임아웃시킵니다.
- 5xx·타임아웃은 지수 백오프로 3회까지 재시도합니다 (`ATTEMPTS`, `TIMEOUT_MS`).
- PR 조회만 실패하면 나머지 대시보드는 그대로 렌더하고 그 구역에만 경고를 띄웁니다.

그래도 502가 반복되면 `commitContributionsByRepository(maxRepositories: 25)` 의 25를 더 낮추세요. 서버 콘솔에 `[patchwork] ... HTTP 502` 와 `x-github-request-id` 가 남습니다.

## 배포

Vercel 등에 배포할 때는 `APP_URL` 을 실제 공개 URL로 설정하고, OAuth 앱의 callback URL도 `https://<도메인>/api/auth/callback` 으로 맞춰야 합니다.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run start   # 빌드 결과 실행
npm run lint    # ESLint
```
