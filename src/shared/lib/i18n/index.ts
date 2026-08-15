/**
 * 문구의 **모양**을 다루는 자리. 사전 데이터도 `next/headers`도 들지 않아 클라이언트
 * 컴포넌트가 가져올 수 있다.
 *
 * 사전 데이터와 요청의 언어는 `@/shared/lib/i18n-server`가 들고 있다.
 * 그쪽은 언어 수만큼 문구를 지고 있으므로 브라우저로 넘어가면 안 된다.
 */
export type { Dictionary, Dictionaries } from "@/shared/lib/i18n/dictionary";
export { interpolate } from "@/shared/lib/i18n/interpolate";
