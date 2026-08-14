# Patchwork

오픈소스 기여 트래커. GitHub contribution과 진행 중인 pull request 상태를 한 화면에 모아 보여줍니다.

흩어진 commit·pull request·review·issue를 patchwork처럼 이어 붙여, **내 repository가 아닌 곳에 얼마나 기여했는지**를 중심으로 보여주는 것이 목표입니다.

## Repository 권위 등급

기여 건수만 세면 star 3개짜리 토이 프로젝트 commit과 널리 쓰이는 프로젝트의 patch가 같은 무게로 잡힙니다. Patchwork는 repository마다 0~100점의 추정 점수를 매겨 네 등급으로 나눕니다 ([src/lib/impact.ts](src/lib/impact.ts)).

| 등급 | 점수 | 의미 |
| --- | --- | --- |
| 대표 OSS | 75+ | 생태계의 중심이 되는 프로젝트 |
| 주요 OSS | 55–74 | 조직이 운영하는 널리 쓰이는 프로젝트 |
| 커뮤니티 | 38–54 | 여러 사람이 함께 유지보수하는 프로젝트 |
| 개인·소규모 | 0–37 | 소수가 관리하는 프로젝트 |

점수 구성:

| 신호 | 배점 | 이유 |
| --- | --- | --- |
| Stars (로그 스케일) | 40 | 규모. 다만 이것만 보면 1인 인기 프로젝트를 걸러낼 수 없다 |
| Forks (로그 스케일) | 20 | 참여 폭 — 혼자 만든 것과 여럿이 손대는 것을 가른다 |
| Organization 소유 | 12 | 개인 계정이 아닌 org 소유 |
| 성숙도 (License·업력) | 16 | 실제로 배포되어 쓰이는지 |
| 활성도 (최근 push) | 12 | 지금도 살아 있는지 |
| Fork / Archived | −25 / −20 | fork는 상류의 명성을 물려받고, archive된 repository는 더 이상 중심이 아니다 |

Private repository는 공개 생태계의 권위 척도 대상이 아니므로 0점으로 둡니다.

GitHub GraphQL에는 contributor count가 없습니다. `mentionableUsers.totalCount` 가 참여 폭에 더 가깝지만, repository마다 사용자를 세느라 집계 쿼리 전체를 타임아웃(502)시켜서 스칼라 필드인 `forkCount` 를 대용치로 씁니다. 신호는 전부 기존 응답에 필드만 추가해 계산하므로 API 요청 수는 늘지 않습니다.

어디까지나 휴리스틱입니다. 가중치와 등급 경계는 `src/lib/impact.ts` 의 `WEIGHTS`, `TIERS` 에서 바로 조정할 수 있습니다. 더 엄밀한 지표가 필요하면 [deps.dev](https://deps.dev) 의 OpenSSF Criticality Score / Scorecard 를 연동하는 방법도 있습니다(패키지로 배포된 repository만 커버되고, repository당 외부 API 호출이 추가됩니다).
