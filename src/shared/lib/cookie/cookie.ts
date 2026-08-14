/** 이 앱이 심는 모든 쿠키의 공통 규칙. 브라우저 스크립트가 읽을 일이 없다. */
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
