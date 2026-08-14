import type { RepoRef } from "@/shared/api";
import type { RepoSignals } from "@/entities/repo/model/impact";

/** GitHub 응답을 권위 추정이 보는 신호로 옮긴다. */
export function repoSignalsOf(repo: RepoRef): RepoSignals {
  return {
    isPrivate: repo.isPrivate,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    isInOrganization: repo.isInOrganization,
    isFork: repo.isFork,
    isArchived: repo.isArchived,
    // GitHub이 분류하지 못한 커스텀 라이선스(key: other)도 '선언은 했다'로 본다.
    hasLicense: repo.licenseInfo !== null,
    createdAt: repo.createdAt,
    pushedAt: repo.pushedAt,
  };
}
