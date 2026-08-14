/**
 * 리다이렉트에 쓸 이 앱의 주소. APP_URL이 있으면 그것을 쓰고, 없으면 요청 origin을 따른다.
 * 프록시 뒤에 있거나 여러 도메인으로 들어오는 배포에서는 APP_URL을 지정해야 한다.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}
