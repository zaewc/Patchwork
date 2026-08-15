/**
 * 사전 데이터와, 요청이 어느 언어인지 알아내는 일.
 *
 * **서버 전용이다.** 공개 API에 `next/headers`를 쓰는 `getDictionary`가 들어 있어
 * 클라이언트 컴포넌트가 이 모듈을 가져오면 빌드가 곧바로 깨진다. 일부러 그렇게 두었다 —
 * 언어가 늘수록 여기 실린 문구도 늘어나므로 브라우저 번들로 새면 안 된다.
 *
 * 클라이언트 컴포넌트에는 서버가 고른 `Dictionary` 하나를 prop으로 넘긴다.
 * 문구를 다루는 도구(`interpolate`)는 `@/shared/lib/i18n`에 있다.
 */
export {
  DICTIONARIES,
  dictionaryOf,
} from "@/shared/lib/i18n-server/dictionaryOf";
export {
  getDictionary,
  requestLocale,
} from "@/shared/lib/i18n-server/requestLocale";
