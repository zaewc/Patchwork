import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  matchLocale,
  parseLocale,
  type Locale,
} from "@/shared/config";
import type { Dictionary } from "@/shared/lib/i18n";
import { dictionaryOf } from "@/shared/lib/i18n-server/dictionaryOf";

/**
 * 이 요청이 어느 언어인지. 사용자가 골라 둔 쿠키가 먼저고, 없으면 브라우저가 보낸
 * Accept-Language를 따른다.
 */
export async function requestLocale(): Promise<Locale> {
  const chosen = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  if (chosen) return chosen;
  return matchLocale((await headers()).get("accept-language"));
}

/** 이 요청에 쓸 문구 묶음. 서버 컴포넌트·라우트 핸들러·서버 유틸이 부른다. */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaryOf(await requestLocale());
}
