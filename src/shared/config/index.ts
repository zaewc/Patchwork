export { appOrigin } from "@/shared/config/app";

export { DEPS_DEV_API_URL, DEPS_DEV_REVALIDATE_SECONDS } from "@/shared/config/deps-dev";

export {
  GITHUB_GRAPHQL_URL,
  GITHUB_OAUTH_AUTHORIZE_URL,
  GITHUB_OAUTH_TOKEN_URL,
  isOAuthConfigured,
  oauthApp,
} from "@/shared/config/github";
export type { OAuthApp } from "@/shared/config/github";

export { parseRange, RANGES, rangeStartDate, windowsFor } from "@/shared/config/ranges";
export type { RangeKey } from "@/shared/config/ranges";

export { ROUTES } from "@/shared/config/routes";
