/**
 * 이 앱이 아는 테마. 첫 번째가 기본값이다.
 *
 * `system`은 "고르지 않았다"는 뜻이다. 그때는 브라우저가 알려 주는 운영체제 설정
 * (`prefers-color-scheme`)을 따르므로, 서버는 무엇을 칠할지 모른 채로 내보낸다.
 * 나머지 둘은 사용자가 골라 둔 것이라 서버가 `<html data-theme>`에 미리 적어 보낸다.
 */
export const THEMES = ["system", "light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "system";

/** 고른 테마를 담아 두는 쿠키. 언어와 마찬가지로 로그인하지 않아도 심는다. */
export const THEME_COOKIE = "pw_theme";
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

/** 우리가 아는 테마가 아니면 null. 쿠키·폼처럼 바깥에서 온 값을 거르는 자리다. */
export function parseTheme(value: unknown): Theme | null {
  return typeof value === "string" &&
    (THEMES as readonly string[]).includes(value)
    ? (value as Theme)
    : null;
}

/**
 * `<html data-theme>`에 적을 값. `system`은 적지 않는다.
 *
 * 속성이 없는 것 자체가 "운영체제를 따르라"는 뜻이고, 그래야 CSS가
 * `:root:not([data-theme="light"])` 한 줄로 "고르지 않았거나 어둡게"를 가릴 수 있다.
 */
export function themeAttribute(theme: Theme): Theme | undefined {
  return theme === DEFAULT_THEME ? undefined : theme;
}
