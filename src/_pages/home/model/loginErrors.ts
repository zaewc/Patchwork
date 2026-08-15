import type { Dictionary } from "@/shared/lib/i18n";

/** OAuth 흐름이 실패하면 라우트 핸들러가 ?error=<key> 로 돌려보낸다. */
const KNOWN = [
  "not_configured",
  "access_denied",
  "invalid_state",
  "token_exchange_failed",
  "identity_failed",
] as const;

const isKnown = (error: string): error is (typeof KNOWN)[number] =>
  (KNOWN as readonly string[]).includes(error);

/**
 * 실패 사유를 사용자의 말로 옮긴다. GitHub이 직접 준 사유(bad_verification_code 등)는
 * 우리가 모르는 값일 수 있으므로 일반 문구로 받는다.
 */
export function loginErrorMessage(
  error: string | string[] | undefined,
  dict: Dictionary,
): string | null {
  if (typeof error !== "string") return null;
  return isKnown(error) ? dict.loginErrors[error] : dict.loginErrors.fallback;
}
