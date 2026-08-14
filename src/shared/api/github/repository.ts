/**
 * 여러 쿼리가 공유하는 Repository 조각과 그 응답 모양.
 *
 * 전부 스칼라(또는 단건 조회) 필드로만 구성한다 — 여기에 커넥션 totalCount를 넣으면
 * Repository 수십 개를 순회할 때 GraphQL 쿼리가 통째로 타임아웃(502)난다.
 */

export const REPO_CORE_FRAGMENT = `
fragment RepoCore on Repository {
  name
  nameWithOwner
  url
  isPrivate
  stargazerCount
  forkCount
  isFork
  isArchived
  isInOrganization
  createdAt
  pushedAt
  owner { login avatarUrl(size: 64) }
  licenseInfo { key }
}`;

/** RepoCore 조각이 돌려주는 값 */
export type RepoRef = {
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  isArchived: boolean;
  isInOrganization: boolean;
  createdAt: string;
  pushedAt: string | null;
  owner: { login: string; avatarUrl: string };
  licenseInfo: { key: string } | null;
};
