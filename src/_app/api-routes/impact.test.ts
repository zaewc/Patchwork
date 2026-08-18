import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleImpact } from "@/_app/api-routes/impact";
import { loadImpact, MAX_IMPACT_KEYS } from "@/_pages/dashboard";
import { getSession } from "@/entities/viewer";

vi.mock("@/_pages/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/_pages/dashboard")>();
  return { MAX_IMPACT_KEYS: original.MAX_IMPACT_KEYS, loadImpact: vi.fn() };
});
vi.mock("@/entities/viewer", () => ({ getSession: vi.fn() }));

const SESSION = {
  token: "gho_token",
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231",
};

const request = (body: unknown, raw?: string) =>
  new Request("http://localhost:3000/api/impact", {
    method: "POST",
    body: raw ?? JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(SESSION);
  vi.mocked(loadImpact).mockResolvedValue([["vercel/next.js", 8]]);
});

describe("POST /api/impact", () => {
  it("로그인하지 않았으면 점수를 내주지 않는다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const response = await handleImpact(request({ keys: ["vercel/next.js"] }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "로그인이 필요합니다.",
    });
    expect(loadImpact).not.toHaveBeenCalled();
  });

  it("건네받은 이름들의 점수표를 돌려준다", async () => {
    const response = await handleImpact(request({ keys: ["vercel/next.js"] }));

    expect(loadImpact).toHaveBeenCalledExactlyOnceWith(["vercel/next.js"]);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [["vercel/next.js", 8]],
    });
  });

  it("물을 것이 없어도 빈 점수표로 답한다", async () => {
    vi.mocked(loadImpact).mockResolvedValue([]);

    const response = await handleImpact(request({ keys: [] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [] });
  });

  /**
   * 목록은 브라우저가 만들어 보낸다. 그대로 믿으면 요청 하나가 바깥으로 수천 번 나갈 수
   * 있으므로, 알아들을 수 없는 몸통은 조용히 자르지 않고 거절한다.
   */
  describe("몸통을 믿지 않는다", () => {
    it.each([
      ["JSON이 아니면", undefined, "이건 JSON이 아니다"],
      ["몸통이 객체가 아니면", 42, undefined],
      ["몸통이 null이면", null, undefined],
      ["keys가 없으면", {}, undefined],
      ["keys가 배열이 아니면", { keys: "vercel/next.js" }, undefined],
      ["문자열이 아닌 이름이 섞이면", { keys: ["a/b", 7] }, undefined],
      ["빈 이름이 섞이면", { keys: ["a/b", ""] }, undefined],
    ])("%s 거절한다", async (_label, body, raw) => {
      const response = await handleImpact(request(body, raw));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "요청이 올바르지 않습니다.",
      });
      expect(loadImpact).not.toHaveBeenCalled();
    });

    it("상한을 넘는 목록은 거절한다", async () => {
      const keys = Array.from(
        { length: MAX_IMPACT_KEYS + 1 },
        (_, i) => `org${i}/repo`,
      );

      const response = await handleImpact(request({ keys }));

      expect(response.status).toBe(400);
      expect(loadImpact).not.toHaveBeenCalled();
    });

    it("상한까지는 받아 준다", async () => {
      const keys = Array.from(
        { length: MAX_IMPACT_KEYS },
        (_, i) => `org${i}/repo`,
      );

      const response = await handleImpact(request({ keys }));

      expect(response.status).toBe(200);
      expect(loadImpact).toHaveBeenCalledExactlyOnceWith(keys);
    });
  });
});
