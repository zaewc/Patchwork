/**
 * 바깥 API를 다루는 공개 API. GitHub 하나뿐이라 이 세그먼트가 곧 GitHub 클라이언트다.
 */

export { githubGraphQL } from "@/shared/api/github/client";
export { GitHubAuthError, GitHubError } from "@/shared/api/github/errors";

export {
  MAX_REPOSITORIES,
  MAX_REPOSITORIES_SECONDARY,
  MAX_SEARCH_PAGES,
} from "@/shared/api/github/limits";

export { REPO_CORE_FRAGMENT } from "@/shared/api/github/repository";
export type { RepoRef } from "@/shared/api/github/repository";

export { VIEWER_FIELDS } from "@/shared/api/github/viewer";
export type { GitHubViewer } from "@/shared/api/github/viewer";
