/**
 * 이 앱이 아는 언어. 첫 번째가 기본값이다.
 *
 * `ko`처럼 언어만 적어도 되고 `pt-BR`·`zh-TW`처럼 지역까지 갈라도 된다.
 * `matchLocale`이 정확한 태그를 먼저 맞춰 보고, 없으면 언어 코드로 내려온다.
 *
 * **로케일을 늘릴 때 고치는 두 곳 중 하나다.** 다른 하나는
 * `shared/lib/i18n-server`의 `DICTIONARIES`이고, 그쪽은 빠뜨리면 타입 검사가 잡는다.
 */
export const LOCALES = ["ko", "en", "ja"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/**
 * 언어 고르는 자리에 붙는 표시. 이름은 늘 그 언어로 적는다 — 어느 쪽을 보고 있든
 * 자기 말을 찾을 수 있어야 하므로, 이 표만은 사전에 넣지 않고 한 벌만 둔다.
 *
 * `countryCode`는 눈에 띄라고 붙이는 국기의 ISO 3166-1 alpha-2 코드다(`react-country-flag`가
 * 이 코드로 그린다). **국기는 나라이지 언어가 아니다** — 영어에 US를 단 것도 한 나라를
 * 고른 것이고, 스페인어(ES·MX)나 아랍어처럼 나라가 여럿인 언어에서는 고를 수가 없다.
 * 뜻을 지고 있는 것은 `name`이므로 화면에서 둘을 늘 함께 보여주고, 스크린 리더에는
 * 국기를 감춘다. 걸리적거리면 이 필드만 지우면 된다.
 */
export const LOCALE_LABELS: Record<
  Locale,
  { countryCode: string; name: string }
> = {
  ko: { countryCode: "KR", name: "한국어" },
  en: { countryCode: "US", name: "English" },
  ja: { countryCode: "JP", name: "日本語" },
};

/** 사용자가 고른 언어를 담아 두는 쿠키. 세션과 달리 로그인하지 않아도 심는다. */
export const LOCALE_COOKIE = "pw_locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

/** 우리가 아는 언어가 아니면 null. 쿠키·폼처럼 바깥에서 온 값을 거르는 자리다. */
export function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" &&
    (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : null;
}

/** `ko-KR;q=0.9` 한 조각 — 언어 태그와 선호도. 빈 조각에는 맞지 않는다. */
const LANGUAGE_RANGE = /^\s*([^;\s,]+)\s*(?:;\s*q\s*=\s*([^;]*))?/;

const baseOf = (tag: string) => tag.split("-")[0];

/**
 * 요청이 바란 태그 하나를 우리가 아는 언어로 옮긴다.
 *
 * 정확히 같은 태그를 먼저 찾는다. `zh-TW`와 `zh-CN`을 따로 지원하게 되는 날
 * 이 순서라야 옳게 갈린다. 그다음에야 언어 코드만 보고 맞춘다 — `ko-KR` 요청이
 * `ko` 사전으로 오는 길이다.
 */
function preferredLocale(tag: string): Locale | undefined {
  return (
    LOCALES.find((locale) => locale.toLowerCase() === tag) ??
    LOCALES.find((locale) => baseOf(locale.toLowerCase()) === baseOf(tag))
  );
}

/**
 * Accept-Language 헤더에서 우리가 아는 언어를 고른다. 쿠키가 아직 없을 때의 첫인상이다.
 * 아는 언어가 하나도 없으면 기본값으로 떨어진다.
 */
export function matchLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => LANGUAGE_RANGE.exec(part))
    .filter((match) => match !== null)
    .map((match) => ({
      tag: match[1]!.toLowerCase(),
      // q가 없으면 1. 숫자가 아니면 NaN이 되어 아래 걸러내기에서 빠진다.
      weight: match[2] === undefined ? 1 : Number(match[2]),
    }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  for (const { tag } of ranked) {
    const found = preferredLocale(tag);
    if (found) return found;
  }

  return DEFAULT_LOCALE;
}
