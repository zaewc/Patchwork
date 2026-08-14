import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { githubGraphQL } from "@/shared/api/github/client";
import { GitHubAuthError, GitHubError } from "@/shared/api/github/errors";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const QUERY = `query Probe { viewer { login } }`;

const fetchMock = vi.fn<typeof fetch>();

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

const ok = (data: unknown) => json({ data });
const graphQLErrors = (errors: { message: string; type?: string }[]) => json({ errors });
const httpError = (status: number, body = "") =>
  new Response(body, { status, headers: { "x-github-request-id": "req-1" } });

/** 재시도 대기(setTimeout)를 흘려보내며 결과를 기다린다. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  const settled = await result;
  if (settled.ok) return settled.value;
  throw settled.error;
}

const call = () => settle(githubGraphQL<{ viewer: { login: string } }>("gho_token", QUERY, {}, "조회"));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("요청 모양", () => {
  it("토큰과 User-Agent를 담아 POST한다", async () => {
    fetchMock.mockResolvedValue(ok({ viewer: { login: "octocat" } }));

    await expect(call()).resolves.toEqual({ viewer: { login: "octocat" } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GITHUB_GRAPHQL);
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer gho_token",
      "Content-Type": "application/json",
      "User-Agent": "Patchwork",
    });
  });

  it("쿼리와 변수를 본문에 싣는다", async () => {
    fetchMock.mockResolvedValue(ok({ viewer: { login: "octocat" } }));

    await settle(githubGraphQL("t", QUERY, { from: "2026-01-01" }));

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      query: QUERY,
      variables: { from: "2026-01-01" },
    });
  });

  it("변수를 생략하면 빈 객체를 보낸다", async () => {
    fetchMock.mockResolvedValue(ok({ viewer: { login: "octocat" } }));

    await settle(githubGraphQL("t", QUERY));

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).variables).toEqual({});
  });

  it("제한 시간 안에 끝내라고 신호를 붙인다", async () => {
    fetchMock.mockResolvedValue(ok({ viewer: { login: "octocat" } }));

    await call();

    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("인증 실패", () => {
  it("401은 재시도 없이 인증 오류로 올린다", async () => {
    fetchMock.mockResolvedValue(httpError(401));

    await expect(call()).rejects.toBeInstanceOf(GitHubAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["FORBIDDEN 타입", [{ message: "권한 없음", type: "FORBIDDEN" }]],
    ["Bad credentials 메시지", [{ message: "Bad credentials" }]],
    ["대소문자가 다른 bad credentials", [{ message: "요청 실패: BAD CREDENTIALS" }]],
  ])("%s 는 인증 오류로 올린다", async (_label, errors) => {
    fetchMock.mockResolvedValue(graphQLErrors(errors));

    await expect(call()).rejects.toBeInstanceOf(GitHubAuthError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("재시도", () => {
  it("일시적인 5xx는 세 번까지 다시 시도한다", async () => {
    fetchMock
      .mockResolvedValueOnce(httpError(502))
      .mockResolvedValueOnce(httpError(504))
      .mockResolvedValueOnce(ok({ viewer: { login: "octocat" } }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(call()).resolves.toEqual({ viewer: { login: "octocat" } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("5xx가 계속되면 상황을 설명하는 오류로 끝난다", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(httpError(503));

    await expect(call()).rejects.toThrow(/HTTP 503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(warn.mock.calls[0].join(" ")).toContain("x-github-request-id=req-1");
  });

  it("request id가 없는 5xx 응답도 기록한다", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));

    await expect(call()).rejects.toBeInstanceOf(GitHubError);
    expect(warn.mock.calls[0].join(" ")).toContain("x-github-request-id=none");
  });

  it("요청 자체가 실패하면 제한 시간을 알려준다", async () => {
    fetchMock.mockRejectedValue(new DOMException("aborted", "TimeoutError"));

    await expect(call()).rejects.toThrow(/조회 요청이 20초 안에 끝나지 않았습니다/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("한 번 끊겼다가 이어지면 성공으로 본다", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("socket hang up"))
      .mockResolvedValueOnce(ok({ viewer: { login: "octocat" } }));

    await expect(call()).resolves.toEqual({ viewer: { login: "octocat" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([["TIMEOUT"], ["SERVICE_UNAVAILABLE"]])("%s 오류는 다시 시도한다", async (type) => {
    fetchMock
      .mockResolvedValueOnce(graphQLErrors([{ message: "느립니다", type }]))
      .mockResolvedValueOnce(ok({ viewer: { login: "octocat" } }));

    await expect(call()).resolves.toEqual({ viewer: { login: "octocat" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("계속 TIMEOUT이면 GitHub이 준 메시지를 모아 올린다", async () => {
    // 세 번 읽히므로 호출마다 새 Response를 만들어야 한다.
    fetchMock.mockImplementation(async () =>
      graphQLErrors([
        { message: "첫 번째", type: "TIMEOUT" },
        { message: "두 번째", type: "TIMEOUT" },
      ]),
    );

    await expect(call()).rejects.toThrow("첫 번째; 두 번째");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("그 밖의 실패", () => {
  it("재시도 대상이 아닌 HTTP 오류는 본문을 붙여 바로 올린다", async () => {
    fetchMock.mockResolvedValue(new Response("rate limit exceeded", { status: 403 }));

    await expect(call()).rejects.toThrow("GitHub API 오류 (HTTP 403): rate limit exceeded");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("긴 오류 본문은 잘라서 보여준다", async () => {
    fetchMock.mockResolvedValue(new Response("타".repeat(500), { status: 400 }));

    await expect(call()).rejects.toThrow(`GitHub API 오류 (HTTP 400): ${"타".repeat(300)}`);
  });

  it("그 밖의 GraphQL 오류는 재시도 없이 올린다", async () => {
    fetchMock.mockResolvedValue(graphQLErrors([{ message: "Field 'foo' doesn't exist" }]));

    await expect(call()).rejects.toThrow("Field 'foo' doesn't exist");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("data가 비어 있으면 오류로 본다", async () => {
    fetchMock.mockResolvedValue(json({}));

    await expect(call()).rejects.toThrow("GitHub 응답이 비어 있습니다.");
  });

  it("label을 생략하면 기본 이름으로 알린다", async () => {
    fetchMock.mockRejectedValue(new Error("네트워크 단절"));

    await expect(settle(githubGraphQL("t", QUERY))).rejects.toThrow(/^GitHub 요청이/);
  });
});

describe("오류 종류", () => {
  it("이름으로 구분할 수 있다", () => {
    expect(new GitHubError("x").name).toBe("GitHubError");
    expect(new GitHubAuthError().name).toBe("GitHubAuthError");
    expect(new GitHubAuthError().message).toMatch(/GitHub 토큰/);
    expect(new GitHubAuthError("직접 지정").message).toBe("직접 지정");
  });
});
