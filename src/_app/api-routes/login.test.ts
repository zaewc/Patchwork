import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleLogin } from "@/_app/api-routes/login";
import { STATE_COOKIE } from "@/_app/api-routes/oauth-state";

const request = (url = "http://localhost:3000/api/auth/login") => new Request(url);

const configure = () => {
  vi.stubEnv("GITHUB_CLIENT_ID", "client-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "client-secret");
  vi.stubEnv("SESSION_SECRET", "0".repeat(64));
};

beforeEach(() => {
  vi.stubEnv("APP_URL", undefined);
  vi.stubEnv("GITHUB_OAUTH_SCOPES", undefined);
});

describe("GET /api/auth/login", () => {
  it("OAuth 설정이 없으면 안내와 함께 홈으로 되돌린다", () => {
    vi.stubEnv("GITHUB_CLIENT_ID", undefined);
    vi.stubEnv("GITHUB_CLIENT_SECRET", undefined);
    vi.stubEnv("SESSION_SECRET", undefined);

    const response = handleLogin(request());

    expect(response.headers.get("location")).toBe("http://localhost:3000/?error=not_configured");
    expect(response.cookies.get(STATE_COOKIE)).toBeUndefined();
  });

  it.each([
    ["Client ID", "GITHUB_CLIENT_ID"],
    ["Client Secret", "GITHUB_CLIENT_SECRET"],
    ["SESSION_SECRET", "SESSION_SECRET"],
  ])("%s 하나만 빠져도 설정이 없는 것으로 본다", (_label, missing) => {
    configure();
    vi.stubEnv(missing, undefined);

    const response = handleLogin(request());
    expect(response.headers.get("location")).toContain("error=not_configured");
  });

  it("GitHub 인가 화면으로 보낸다", () => {
    configure();

    const response = handleLogin(request());
    const location = new URL(response.headers.get("location")!);

    expect(location.origin + location.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(location.searchParams.get("client_id")).toBe("client-id");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback",
    );
  });

  it("기본 scope는 read:user다", () => {
    configure();

    const response = handleLogin(request());
    expect(new URL(response.headers.get("location")!).searchParams.get("scope")).toBe("read:user");
  });

  it("scope를 환경변수로 넓힐 수 있다", () => {
    configure();
    vi.stubEnv("GITHUB_OAUTH_SCOPES", "read:user,repo");

    const response = handleLogin(request());
    expect(new URL(response.headers.get("location")!).searchParams.get("scope")).toBe(
      "read:user,repo",
    );
  });

  it("state를 쿠키와 URL에 같은 값으로 심는다", () => {
    configure();

    const response = handleLogin(request());
    const state = new URL(response.headers.get("location")!).searchParams.get("state");
    const cookie = response.cookies.get(STATE_COOKIE);

    expect(state).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(cookie?.value).toBe(state);
  });

  it("state 쿠키는 10분만 살아 있는 httpOnly 쿠키다", () => {
    configure();

    const cookie = handleLogin(request()).cookies.get(STATE_COOKIE);

    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  });

  it("요청마다 다른 state를 만든다", () => {
    configure();

    const first = handleLogin(request()).cookies.get(STATE_COOKIE)?.value;
    const second = handleLogin(request()).cookies.get(STATE_COOKIE)?.value;

    expect(first).not.toBe(second);
  });

  it("APP_URL이 있으면 그 주소로 되돌아오게 한다", () => {
    configure();
    vi.stubEnv("APP_URL", "https://patchwork.example.com");

    const response = handleLogin(request());
    expect(new URL(response.headers.get("location")!).searchParams.get("redirect_uri")).toBe(
      "https://patchwork.example.com/api/auth/callback",
    );
  });
});
