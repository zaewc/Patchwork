# Patchwork

오픈소스 기여 트래커. GitHub contribution과 진행 중인 pull request 상태를 한 화면에 모아 보여줍니다.

흩어진 commit·pull request·review·issue를 patchwork처럼 이어 붙여, **내 repository가 아닌 곳에 얼마나 기여했는지**를 중심으로 보여주는 것이 목표입니다.

## 주요 OSS 판별

기여 건수만 세면 star 3개짜리 토이 프로젝트 commit과 널리 쓰이는 프로젝트의 patch가 같은 무게로 잡힙니다. Patchwork는 repository마다 0~100점의 추정 점수를 매기고, **60점(`NOTABLE_MIN`) 이상만 주요 OSS로 봅니다** ([src/lib/impact.ts](src/lib/impact.ts)). 실질적인 기준선은 Stars 600개 안팎입니다.

대시보드는 기본으로 주요 OSS만 보여줍니다. Repositories·Open pull requests·Recently merged 세 목록이 모두 이 기준으로 걸러지고, 상단의 `전체` 탭(`?scope=all`)을 누르면 일반 프로젝트까지 나옵니다. 목록 자체가 주요 OSS로 걸러지므로 행마다 등급 배지를 달지는 않습니다.

점수는 두 덩어리로 나뉘고, 그냥 더하지 않습니다.

```
score = audience + min(trust, audience)
```

| 덩어리 | 신호 | 배점 |
| --- | --- | --- |
| **audience** — 바깥에서 쓰거나 참여한 흔적 | Stars (로그 스케일) | 45 |
| | Forks (로그 스케일) | 15 |
| **trust** — 잘 관리되고 있다는 신호 | Organization 소유 | 14 |
| | 업력 2년 이상 | 10 |
| | 최근 push (90일 내 16 / 1년 내 8) | 16 |
| 감점 | Fork / Archived | −25 / −20 |

`trust`가 `audience`를 넘지 못하게 묶은 것이 핵심입니다. 이렇게 하지 않으면 아무도 쓰지 않는 사내 프로젝트가 "org 소유 + License + 최근 push"만으로 주요 OSS에 올라옵니다. 외부 관심이 0이면 아무리 잘 관리해도 0점입니다.

점수와 별개로 **자격 조건**이 둘 있습니다. 하나라도 못 채우면 점수가 59점(= 주요 OSS 미만)으로 묶입니다.

- **Stars 30개 이상** (`MIN_STARS`) — 하한선. fork만 많은 강의·템플릿 repository를 거르는 역할도 합니다.
- **License 선언** — 없으면 정의상 오픈소스가 아닙니다. GitHub이 분류하지 못한 커스텀 License(`key: other`)는 "선언은 했다"로 보고 통과시킵니다.

자격 조건을 넘겨도 점수 계산까지 통과해야 주요 OSS로 잡힙니다.

Private repository는 공개 생태계의 권위 척도 대상이 아니므로 0점으로 둡니다.

GitHub GraphQL에는 contributor count가 없습니다. `mentionableUsers.totalCount` 가 참여 폭에 더 가깝지만, repository마다 사용자를 세느라 집계 쿼리 전체를 타임아웃(502)시켜서 스칼라 필드인 `forkCount` 를 대용치로 씁니다. 신호는 전부 기존 응답에 필드만 추가해 계산하므로 API 요청 수는 늘지 않습니다.

어디까지나 휴리스틱입니다. 가중치와 등급 경계는 `src/lib/impact.ts` 의 `WEIGHTS`, `TIERS` 에서 바로 조정할 수 있습니다. 더 엄밀한 지표가 필요하면 [deps.dev](https://deps.dev) 의 OpenSSF Criticality Score / Scorecard 를 연동하는 방법도 있습니다(패키지로 배포된 repository만 커버되고, repository당 외부 API 호출이 추가됩니다).
