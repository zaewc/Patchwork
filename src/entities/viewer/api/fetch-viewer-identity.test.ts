import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchViewerIdentity } from "@/entities/viewer/api/fetch-viewer-identity";
import { VIEWER } from "@/shared/api/github/response.fixtures";

const fetchMock = vi.fn<typeof fetch>();

const bodyText = (body: BodyInit | null | undefined): string => {
  if (typeof body !== "string") throw new TypeError("GraphQL 요청 본문이 문자열이 아닙니다.");
  return body;
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("fetchViewerIdentity", () => {
  it("토큰의 주인을 돌려준다", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { viewer: VIEWER } })));

    await expect(fetchViewerIdentity("gho_token")).resolves.toEqual(VIEWER);
  });

  it("헤더를 그리는 데 필요한 필드만 묻는다", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { viewer: VIEWER } })));

    await fetchViewerIdentity("gho_token");

    const { query } = JSON.parse(bodyText(fetchMock.mock.calls[0]![1]?.body)) as {
      query: string;
    };
    expect(query).toContain("viewer");
    expect(query).toContain("login");
    expect(query).toContain("avatarUrl");
    expect(query).not.toContain("contributionsCollection");
  });

  it("토큰이 죽었으면 실패를 그대로 올린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));

    await expect(fetchViewerIdentity("gho_token")).rejects.toThrow(/GitHub 토큰/);
  });
});
