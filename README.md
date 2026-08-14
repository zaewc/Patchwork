# Patchwork

오픈소스 기여 트래커. GitHub contribution과 진행 중인 pull request 상태를 한 화면에 모아 보여줍니다.

흩어진 commit·pull request·review·issue를 patchwork처럼 이어 붙여, **내 repository가 아닌 곳에 얼마나 기여했는지**를 중심으로 보여주는 것이 목표입니다.

## Repository 권위 등급

기여 건수만 세면 star 3개짜리 토이 프로젝트 commit과 널리 쓰이는 프로젝트의 patch가 같은 무게로 잡힙니다. Patchwork는 repository마다 0~100점의 추정 점수를 매겨 네 등급으로 나눕니다 ([src/lib/impact.ts](src/lib/impact.ts)).

| 등급 | 점수 | 의미 |
| --- | --- | --- |
| 대표 OSS | 80+ | 생태계의 중심이 되는 프로젝트 |
| 주요 OSS | 60–79 | 널리 쓰이는 프로젝트 |
| 커뮤니티 | 40–59 | 바깥에서 쓰고 참여하는 프로젝트 |
| 개인·소규모 | 0–39 | 사실상 내부용 프로젝트 |

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

`trust`가 `audience`를 넘지 못하게 묶은 것이 핵심입니다. 이렇게 하지 않으면 아무도 쓰지 않는 사내 프로젝트가 "org 소유 + License + 최근 push"만으로 커뮤니티 등급에 올라옵니다. 외부 관심이 0이면 아무리 잘 관리해도 0점입니다.

License가 없는 repository는 정의상 오픈소스가 아니므로 점수 상한을 30점(= 등급 없음)으로 둡니다. GitHub이 분류하지 못한 커스텀 License(`key: other`)는 "선언은 했다"로 보고 통과시킵니다.

Private repository는 공개 생태계의 권위 척도 대상이 아니므로 0점으로 둡니다.

GitHub GraphQL에는 contributor count가 없습니다. `mentionableUsers.totalCount` 가 참여 폭에 더 가깝지만, repository마다 사용자를 세느라 집계 쿼리 전체를 타임아웃(502)시켜서 스칼라 필드인 `forkCount` 를 대용치로 씁니다. 신호는 전부 기존 응답에 필드만 추가해 계산하므로 API 요청 수는 늘지 않습니다.

어디까지나 휴리스틱입니다. 가중치와 등급 경계는 `src/lib/impact.ts` 의 `WEIGHTS`, `TIERS` 에서 바로 조정할 수 있습니다. 더 엄밀한 지표가 필요하면 [deps.dev](https://deps.dev) 의 OpenSSF Criticality Score / Scorecard 를 연동하는 방법도 있습니다(패키지로 배포된 repository만 커버되고, repository당 외부 API 호출이 추가됩니다).
