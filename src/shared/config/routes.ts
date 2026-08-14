/** 앱 안의 주소를 한 곳에서 정한다. 라우팅 폴더 구조를 바꿔도 여기만 고치면 된다. */
export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  export: "/export",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  callback: "/api/auth/callback",
} as const;
