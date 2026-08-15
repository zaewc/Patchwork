/** OAuth 흐름이 실패하면 라우트 핸들러가 ?error=<key> 로 돌려보낸다. */
const MESSAGES: Record<string, string> = {
  not_configured: "GitHub OAuth 환경변수가 설정되지 않았습니다.",
  access_denied: "GitHub 로그인이 취소되었습니다.",
  invalid_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  token_exchange_failed:
    "토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
  identity_failed: "GitHub 사용자 정보를 가져오지 못했습니다.",
};

/**
 * 실패 사유를 사용자의 말로 옮긴다. GitHub이 직접 준 사유(bad_verification_code 등)는
 * 우리가 모르는 값일 수 있으므로 일반 문구로 받는다.
 */
export function loginErrorMessage(
  error: string | string[] | undefined,
): string | null {
  if (typeof error !== "string") return null;
  return MESSAGES[error] ?? "로그인 중 문제가 발생했습니다.";
}
