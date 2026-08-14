/**
 * 여러 쿼리가 공유하는 Repository 조각과 그 응답 모양.
 *
 * 필드를 늘리기 전에 한 번 더 생각할 것: 전부 스칼라(또는 단건 조회)여야 한다.
 * 여기에 커넥션 totalCount를 넣으면 Repository 수십 개를 순회할 때 GraphQL 쿼리가
 * 통째로 타임아웃(502)난다.
 *
 * 관리 품질 신호(License·업력·활성도 등)는 GitHub에 묻지 않는다. OpenSSF Scorecard가
 * 같은 것을 더 엄밀하게 재므로 deps.dev에서 받는다.
 */

export const REPO_CORE_FRAGMENT = `
fragment RepoCore on Repository {
  name
  nameWithOwner
  url
  isPrivate
  stargazerCount
  forkCount
  owner { login avatarUrl(size: 64) }
}`;

/** RepoCore 조각이 돌려주는 값 */
export type RepoRef = {
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  owner: { login: string; avatarUrl: string };
};
