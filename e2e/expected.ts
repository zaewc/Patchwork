/**
 * mock GitHub 데이터로부터 화면에 나와야 할 값. 계산 근거를 함께 남긴다.
 * (e2e/mock-github/data.mjs 를 바꾸면 여기도 같이 고친다)
 */

/** 90일 달력 = [0,1,2,5,9,0,3] 반복 → 앞 6칸 13회 + 마지막 칸 12회 */
export const CONTRIBUTIONS = 13 * (0 + 1 + 2 + 5 + 9 + 0) + 12 * 3;

export const RESTRICTED = 12;

/** repository별 합계 */
export const TOTALS = {
  nextJs: 40 + 5 + 2 + 1, // commits + PR + review + issue
  mine: 12,
  privateRepo: 5,
  toy: 3 + 1,
};

const ALL = TOTALS.nextJs + TOTALS.mine + TOTALS.privateRepo + TOTALS.toy;

/** 내 소유(octocat/patchwork)를 뺀 나머지 */
export const EXTERNAL = TOTALS.nextJs + TOTALS.privateRepo + TOTALS.toy;
export const EXTERNAL_RATIO = Math.round((EXTERNAL / ALL) * 100);

/** 주요 OSS는 vercel/next.js 한 곳뿐이다 */
export const NOTABLE = { repos: 1, contributions: TOTALS.nextJs };

export const OPEN_PULL_REQUESTS = { all: 5, notable: 4, stale: 1 };
export const MERGED_PULL_REQUESTS = { all: 2, notable: 1 };

/** 전체 보기의 repository 표 정렬 (합계 내림차순) */
export const REPO_ORDER = [
  "vercel/next.js",
  "octocat/patchwork",
  "acme/internal",
  "someone/toy-lib",
];

export const EXPORT_ITEMS = {
  /** 주요 OSS 모드: next.js의 merge된 PR 2건 + 완료된 issue 1건, 시간순 */
  notableTitles: [
    "fix: [docs] 링크 교정",
    "docs: 설치 안내가 낡았습니다",
    "perf: 번들 크기 줄이기",
  ],
  /** 결론이 나지 않아 빠져야 하는 것들 */
  excluded: ["wip: 아직 열려 있음", "질문: 이건 계획에 없습니다"],
};
