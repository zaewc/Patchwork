import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleCallback } from "@/_app/api-routes/callback";
import { fetchViewerIdentity } from "@/entities/viewer";
import { STATE_COOKIE } from "@/_app/api-routes/oauth-state";
import { SESSION_COOKIE, unseal } from "@/entities/viewer";

vi.mock("@/entities/viewer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/viewer")>()),
  fetchViewerIdentity: vi.fn(),
}));

const STATE = "state-value";
const VIEWER = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const TOKEN_URL = "https://github.com/login/oauth/access_token";

const fetchMock = vi.fn<typeof fetch>();

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, ...init });

/** 콜백 요청. state 쿠키가 있는 상태를 기본으로 한다. */
function request({
  code = "oauth-code",
  state = STATE,
  cookie = `${STATE_COOKIE}=${STATE}`,
  error,
}: {
  code?: string | null;
  state?: string | null;
  cookie?: string | null;
  error?: string;
} = {}) {
  const url = new URL("http://localhost:3000/api/auth/callback");
  if (code !== null) url.searchParams.set("code", code);
  if (state !== null) url.searchParams.set("state", state);
  if (error) url.searchParams.set("error", error);

  return new Request(url, { headers: cookie === null ? {} : { cookie } });
}

/** NextResponse.cookies.delete()가 남기는 모양 */
const CLEARED = { value: "", expires: new Date(0) };

const errorOf = (response: Response) =>
  new URL(response.headers.get("location")!).searchParams.get("error");

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(json({ access_token: "gho_token" }));
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(fetchViewerIdentity).mockReset();
  vi.mocked(fetchViewerIdentity).mockResolvedValue(VIEWER);
  vi.stubEnv("APP_URL", undefined);
  vi.stubEnv("SESSION_SECRET", "0".repeat(64));
  vi.stubEnv("GITHUB_CLIENT_ID", "client-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "client-secret");
});

describe("GET /api/auth/callback · 거절", () => {
  it("사용자가 인가를 취소하면 안내와 함께 홈으로 보낸다", async () => {
    const response = await handleCallback(request({ error: "access_denied" }));

    expect(errorOf(response)).toBe("access_denied");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("인가 취소는 state 쿠키를 정리한다", async () => {
    const response = await handleCallback(request({ error: "access_denied" }));
    expect(response.cookies.get(STATE_COOKIE)).toMatchObject(CLEARED);
  });

  it.each([
    ["code가 없으면", { code: null }],
    ["state가 없으면", { state: null }],
    ["state 쿠키가 없으면", { cookie: null }],
    ["쿠키에 state가 섞여 있지 않으면", { cookie: "other=1; another=2" }],
    ["state가 쿠키와 다르면", { state: "다른-값-길이도-다름" }],
    ["state가 길이만 같고 다르면", { state: "state-valuE" }],
  ])("%s 요청을 버린다", async (_label, overrides) => {
    const response = await handleCallback(request(overrides));

    expect(errorOf(response)).toBe("invalid_state");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("여러 쿠키가 함께 와도 state를 찾아낸다", async () => {
    const response = await handleCallback(
      request({ cookie: `foo=1; ${STATE_COOKIE}=${STATE}; bar=2` }),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});

describe("GET /api/auth/callback · 토큰 교환", () => {
  it("code와 앱 자격증명을 담아 토큰을 받아온다", async () => {
    await handleCallback(request());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TOKEN_URL);
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(JSON.parse(String(init?.body))).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      code: "oauth-code",
      redirect_uri: "http://localhost:3000/api/auth/callback",
    });
  });

  it("토큰 요청이 실패하면 안내와 함께 홈으로 보낸다", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));

    expect(errorOf(await handleCallback(request()))).toBe("token_exchange_failed");
  });

  it("GitHub이 준 오류 사유를 그대로 전달한다", async () => {
    fetchMock.mockResolvedValue(json({ error: "bad_verification_code" }));

    expect(errorOf(await handleCallback(request()))).toBe("bad_verification_code");
  });

  it("사유 없이 토큰이 비어 있으면 교환 실패로 본다", async () => {
    fetchMock.mockResolvedValue(json({}));

    expect(errorOf(await handleCallback(request()))).toBe("token_exchange_failed");
  });

  it("OAuth 앱 설정이 사라졌으면 교환을 시도하지 않는다", async () => {
    vi.stubEnv("GITHUB_CLIENT_SECRET", undefined);

    expect(errorOf(await handleCallback(request()))).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("사용자 정보를 못 가져오면 안내와 함께 홈으로 보낸다", async () => {
    vi.mocked(fetchViewerIdentity).mockRejectedValue(new Error("토큰이 유효하지 않습니다"));

    expect(errorOf(await handleCallback(request()))).toBe("identity_failed");
  });
});

describe("GET /api/auth/callback · 성공", () => {
  it("대시보드로 보낸다", async () => {
    const response = await handleCallback(request());
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("받은 토큰으로 사용자 정보를 조회한다", async () => {
    await handleCallback(request());
    expect(fetchViewerIdentity).toHaveBeenCalledExactlyOnceWith("gho_token");
  });

  it("토큰과 사용자 정보를 봉인해 세션 쿠키에 담는다", async () => {
    const response = await handleCallback(request());
    const cookie = response.cookies.get(SESSION_COOKIE);

    expect(unseal(cookie!.value)).toEqual({ token: "gho_token", ...VIEWER });
  });

  it("세션 쿠키는 30일짜리 httpOnly 쿠키다", async () => {
    const cookie = (await handleCallback(request())).cookies.get(SESSION_COOKIE);

    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it("쓰임을 다한 state 쿠키를 지운다", async () => {
    const response = await handleCallback(request());
    expect(response.cookies.get(STATE_COOKIE)).toMatchObject(CLEARED);
  });

  it("이름이 없는 사용자도 그대로 담는다", async () => {
    vi.mocked(fetchViewerIdentity).mockResolvedValue({ ...VIEWER, name: null });

    const response = await handleCallback(request());
    expect(unseal(response.cookies.get(SESSION_COOKIE)!.value)?.name).toBeNull();
  });

  it("APP_URL이 있으면 그 주소의 대시보드로 보낸다", async () => {
    vi.stubEnv("APP_URL", "https://patchwork.example.com");

    const response = await handleCallback(request());
    expect(response.headers.get("location")).toBe("https://patchwork.example.com/dashboard");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).redirect_uri).toBe(
      "https://patchwork.example.com/api/auth/callback",
    );
  });
});
