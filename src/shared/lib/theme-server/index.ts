/**
 * 요청이 어느 테마인지 알아내는 일.
 *
 * **서버 전용이다.** `next/headers`를 쓰므로 클라이언트 컴포넌트가 가져오면 빌드가 깨진다.
 * 테마 값 자체(`THEMES`·`parseTheme`)는 브라우저도 알아야 하므로 `shared/config/theme.ts`에
 * 따로 두었다 — `i18n`과 `i18n-server`를 가른 것과 같은 이유다.
 */
export { requestTheme } from "@/shared/lib/theme-server/requestTheme";
