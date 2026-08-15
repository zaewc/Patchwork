/**
 * 사전 문구의 `{이름}` 자리를 값으로 채운다.
 *
 * 사전을 문자열로만 두는 이유는 서버 컴포넌트가 클라이언트 컴포넌트로 그대로 넘기기
 * 위해서다(함수는 직렬화되지 않는다). 그래서 값이 끼어드는 자리를 여기서 메운다.
 * 모르는 이름은 그대로 남긴다 — 번역이 빠진 것을 조용히 지우지 않는다.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
