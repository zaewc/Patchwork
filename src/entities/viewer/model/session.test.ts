import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/entities/viewer/model/session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const SECRET = "0".repeat(64);

const SESSION: Session = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

/**
 * 봉인 열쇠가 모듈 스코프에 캐시되므로 SESSION_SECRET을 바꾸는 테스트는 모듈을 새로 불러야 한다.
 * secret에 null을 주면 환경변수가 아예 없는 상태를 만든다.
 */
async function loadSession(secret: string | null = SECRET) {
  vi.resetModules();
  vi.stubEnv("SESSION_SECRET", secret === null ? undefined : secret);
  return import("@/entities/viewer/model/session");
}

const mockCookie = (value?: string) => {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === "pw_session" && value ? { name, value } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
};

beforeEach(() => {
  vi.resetModules();
});

describe("SESSION_SECRET 검증", () => {
  it("환경변수가 없으면 안내와 함께 실패한다", async () => {
    const { seal } = await loadSession(null);
    expect(() => seal(SESSION)).toThrow(/SESSION_SECRET/);
  });

  it("32자보다 짧으면 실패한다", async () => {
    const { seal } = await loadSession("short-secret");
    expect(() => seal(SESSION)).toThrow(/32자 이상/);
  });
});

describe("seal · unseal", () => {
  it("왕복하면 원래 세션이 나온다", async () => {
    const { seal, unseal } = await loadSession();
    expect(unseal(seal(SESSION))).toEqual(SESSION);
  });

  it("같은 세션도 매번 다른 문자열로 봉인된다", async () => {
    const { seal } = await loadSession();
    expect(seal(SESSION)).not.toBe(seal(SESSION));
  });

  it("쿠키에 담을 수 있는 base64url 문자열이다", async () => {
    const { seal } = await loadSession();
    expect(seal(SESSION)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("헤더·인증태그 길이에 못 미치는 값은 거부한다", async () => {
    const { unseal } = await loadSession();
    expect(unseal("")).toBeNull();
    expect(unseal(Buffer.alloc(28).toString("base64url"))).toBeNull();
  });

  it("본문을 건드린 값은 인증태그 검증에서 거부한다", async () => {
    const { seal, unseal } = await loadSession();
    const raw = Buffer.from(seal(SESSION), "base64url");
    const lastIndex = raw.length - 1;
    raw[lastIndex] = raw[lastIndex]! ^ 0xff;
    expect(unseal(raw.toString("base64url"))).toBeNull();
  });

  it("다른 SESSION_SECRET으로 봉인한 값은 거부한다", async () => {
    const { seal } = await loadSession("1".repeat(64));
    const sealed = seal(SESSION);
    const { unseal } = await loadSession("2".repeat(64));
    expect(unseal(sealed)).toBeNull();
  });

  it("복호화는 되지만 세션 모양이 아니면 거부한다", async () => {
    const { seal, unseal } = await loadSession();
    expect(unseal(seal({ login: "octocat" } as unknown as Session))).toBeNull();
    expect(unseal(seal({ token: "t" } as unknown as Session))).toBeNull();
    expect(unseal(seal(null as unknown as Session))).toBeNull();
    expect(unseal(seal("문자열" as unknown as Session))).toBeNull();
  });
});

describe("getSession", () => {
  it("쿠키가 없으면 null이다", async () => {
    const { getSession } = await loadSession();
    mockCookie(undefined);
    await expect(getSession()).resolves.toBeNull();
  });

  it("쿠키가 유효하면 세션을 준다", async () => {
    const { getSession, seal } = await loadSession();
    mockCookie(seal(SESSION));
    await expect(getSession()).resolves.toEqual(SESSION);
  });

  it("쿠키가 깨졌으면 null이다", async () => {
    const { getSession } = await loadSession();
    mockCookie("깨진-값");
    await expect(getSession()).resolves.toBeNull();
  });
});
