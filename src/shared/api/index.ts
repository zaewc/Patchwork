/**
 * 바깥 API를 다루는 공개 API.
 *  - GitHub GraphQL — 기여 내역과 pull request
 *  - deps.dev — OpenSSF Scorecard
 */

export { fetchDepsDevProject } from "@/shared/api/deps-dev/client";
export type { DepsDevProject } from "@/shared/api/deps-dev/client";

export { githubGraphQL } from "@/shared/api/github/client";
export type { GitHubMessages } from "@/shared/api/github/client";
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
