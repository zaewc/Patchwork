import type { RepoSignals } from "@/entities/repo/model/impact";
import type { RepoScoring } from "@/entities/repo/model/scoring";
import type { RepoRef } from "@/shared/api";

/** GitHub 응답에서 점수 계산에 쓰는 신호만 뽑는다. */
export function repoSignalsOf(repo: RepoRef): RepoSignals {
  return {
    isPrivate: repo.isPrivate,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
  };
}

/** 점수를 나중에 매기기 위해 들고 다니는 꼬리표 */
export function repoScoringOf(repo: RepoRef): RepoScoring {
  return { key: repo.nameWithOwner, signals: repoSignalsOf(repo) };
}
