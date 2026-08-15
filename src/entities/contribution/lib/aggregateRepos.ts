import {
  repoScoringOf,
  REPO_COUNT_FIELDS,
  type RepoCountField,
  type RepoStat,
  type Unscored,
} from "@/entities/repo/@x/contribution";
import type {
  ContributionsByRepository,
  ContributionsCollection,
} from "@/entities/contribution/model/types";
import {
  MAX_REPOSITORIES,
  MAX_REPOSITORIES_SECONDARY,
  type RepoRef,
} from "@/shared/api";

/** 집계에 쓰는 네 항목과, 각 항목이 걸리는 GitHub 상한 */
const SOURCES: {
  field: RepoCountField;
  key: keyof ContributionsCollection & `${string}ByRepository`;
  cap: number;
}[] = [
  {
    field: "commits",
    key: "commitContributionsByRepository",
    cap: MAX_REPOSITORIES,
  },
  {
    field: "pullRequests",
    key: "pullRequestContributionsByRepository",
    cap: MAX_REPOSITORIES_SECONDARY,
  },
  {
    field: "reviews",
    key: "pullRequestReviewContributionsByRepository",
    cap: MAX_REPOSITORIES_SECONDARY,
  },
  {
    field: "issues",
    key: "issueContributionsByRepository",
    cap: MAX_REPOSITORIES_SECONDARY,
  },
];

type Draft = {
  repo: RepoRef;
  counts: Record<RepoCountField, number>;
  total: number;
};

/**
 * 상한에 걸려 잘린 (조회 창, 항목) 하나하나가 "구멍"이다. 그 목록에 없던 repository는
 * 해당 항목의 수를 알 수 없다. 창 단위로 기록해야 5년처럼 창이 여러 개일 때
 * "창 하나에서만 잘린" 경우를 놓치지 않는다.
 */
type Gap = { field: RepoCountField; listed: Set<string> };

/**
 * 여러 조회 창의 기여를 repository별로 합친다. 기여가 많은 곳부터, 동점이면 이름 순.
 *
 * GitHub 상한에 걸려 목록이 잘렸다면 그 목록에 없던 repository의 해당 항목은 null로 둔다.
 * 0으로 두면 "기여가 없었다"와 "알 수 없다"가 구분되지 않는다.
 *
 * impact는 여기서 매기지 않는다. deps.dev의 Scorecard를 받아야 알 수 있으므로 꼬리표만
 * 달아 두고, 부르는 쪽이 withImpact로 완성한다.
 */
export function aggregateRepos(
  collections: ContributionsCollection[],
  viewerLogin: string,
): Unscored<RepoStat>[] {
  const drafts = new Map<string, Draft>();
  const gaps: Gap[] = [];

  const merge = (
    entries: ContributionsByRepository,
    field: RepoCountField,
    cap: number,
  ) => {
    if (entries.length >= cap) {
      gaps.push({
        field,
        listed: new Set(entries.map((e) => e.repository.nameWithOwner)),
      });
    }

    for (const entry of entries) {
      const repo = entry.repository;
      let draft = drafts.get(repo.nameWithOwner);
      if (!draft) {
        draft = {
          repo,
          counts: { commits: 0, pullRequests: 0, reviews: 0, issues: 0 },
          total: 0,
        };
        drafts.set(repo.nameWithOwner, draft);
      }
      draft.counts[field] += entry.contributions.totalCount;
      draft.total += entry.contributions.totalCount;
    }
  };

  for (const collection of collections) {
    for (const source of SOURCES)
      merge(collection[source.key], source.field, source.cap);
  }

  const login = viewerLogin.toLowerCase();

  return [...drafts.values()]
    .map(({ repo, counts, total }): Unscored<RepoStat> => {
      const known = (field: RepoCountField) =>
        gaps.every(
          (gap) => gap.field !== field || gap.listed.has(repo.nameWithOwner),
        );

      const counted = Object.fromEntries(
        REPO_COUNT_FIELDS.map((field) => [
          field,
          known(field) ? counts[field] : null,
        ]),
      ) as Record<RepoCountField, number | null>;

      return {
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        ownerAvatarUrl: repo.owner.avatarUrl,
        isPrivate: repo.isPrivate,
        isExternal: repo.owner.login.toLowerCase() !== login,
        scoring: repoScoringOf(repo),
        ...counted,
        total,
      };
    })
    .sort(
      (a, b) =>
        b.total - a.total || a.nameWithOwner.localeCompare(b.nameWithOwner),
    );
}
