/**
 * 바깥 세계로 나가는 주소. 기본값은 github.com이고, 환경변수로 갈아끼울 수 있다.
 * E2E 테스트가 mock 서버를 물리는 통로이며, GitHub Enterprise를 붙일 여지도 남긴다.
 */

export const GITHUB_GRAPHQL_URL =
  process.env.GITHUB_GRAPHQL_URL ?? "https://api.github.com/graphql";

export const GITHUB_OAUTH_AUTHORIZE_URL =
  process.env.GITHUB_OAUTH_AUTHORIZE_URL ?? "https://github.com/login/oauth/authorize";

export const GITHUB_OAUTH_TOKEN_URL =
  process.env.GITHUB_OAUTH_TOKEN_URL ?? "https://github.com/login/oauth/access_token";
