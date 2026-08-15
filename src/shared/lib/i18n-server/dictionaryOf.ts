import type { Locale } from "@/shared/config";
import type { Dictionaries, Dictionary } from "@/shared/lib/i18n";
import { en } from "@/shared/lib/i18n-server/en";
import { ko } from "@/shared/lib/i18n-server/ko";

/**
 * 언어와 문구 묶음을 잇는 표. **로케일을 늘릴 때 고치는 두 곳 중 하나다**
 * (다른 하나는 `shared/config/locale.ts`의 `LOCALES`·`LOCALE_NAMES`).
 *
 * `Dictionaries`가 `Record<Locale, Dictionary>`라 언어를 목록에만 넣고 여기를
 * 빠뜨리면 타입 검사에서 걸린다.
 */
export const DICTIONARIES: Dictionaries = { ko, en };

/** 언어 하나의 문구 묶음 */
export function dictionaryOf(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
