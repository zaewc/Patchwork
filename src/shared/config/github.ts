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

export type OAuthApp = { clientId: string; clientSecret: string };

/**
 * OAuth에 필요한 자격증명 묶음. 하나라도 없으면 null이다.
 * 세션을 봉인할 열쇠(SESSION_SECRET)가 없으면 로그인시켜도 상태를 유지할 수 없으므로
 * 그것까지 갖춰졌을 때만 "설정됐다"고 본다.
 */
export function oauthApp(): OAuthApp | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.SESSION_SECRET) return null;
  return { clientId, clientSecret };
}

/** 로그인 버튼을 보여줄지 판단할 때 쓴다. */
export function isOAuthConfigured(): boolean {
  return oauthApp() !== null;
}
