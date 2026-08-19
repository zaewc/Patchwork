import { cookies } from "next/headers";
import {
  DEFAULT_THEME,
  parseTheme,
  THEME_COOKIE,
  type Theme,
} from "@/shared/config";

/**
 * 이 요청이 어느 테마인지. 골라 둔 쿠키가 없으면 `system`이다.
 *
 * 언어와 달리 헤더로는 알 수 없다 — 운영체제 설정은 브라우저 안에만 있고 요청에 실려
 * 오지 않는다. 그래서 "모른다"를 값으로 두고, 그 경우의 판단은 CSS에 맡긴다.
 */
export async function requestTheme(): Promise<Theme> {
  return (
    parseTheme((await cookies()).get(THEME_COOKIE)?.value) ?? DEFAULT_THEME
  );
}
