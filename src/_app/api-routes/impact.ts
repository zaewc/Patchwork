import { loadImpact, MAX_IMPACT_KEYS } from "@/_pages/dashboard";
import { getSession } from "@/entities/viewer";
import { getDictionary } from "@/shared/lib/i18n-server";

/** 브라우저가 보내온 몸통에서 물어볼 repository 이름만 받아 낸다. */
function parseKeys(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null;

  const { keys } = body as { keys?: unknown };
  if (!Array.isArray(keys) || keys.length > MAX_IMPACT_KEYS) return null;

  const names: unknown[] = keys;
  if (
    !names.every((key): key is string => typeof key === "string" && key !== "")
  )
    return null;

  return names;
}

/**
 * 화면이 점수표를 따로 받아 가는 통로.
 *
 * 무엇을 물을지는 브라우저가 정한다 — 점수 없는 핵심 데이터를 먼저 받았으니 그 안의
 * 꼬리표로 목록을 만들 수 있다. 대신 그 목록을 그대로 믿지 않고, 로그인한 요청인지와
 * 상한을 넘지 않는 이름 목록인지를 여기서 본다.
 *
 * deps.dev 조회는 곁가지라 실패를 삼키고 "모른다"로 돌려주므로 이 자리에 실패는 없다.
 */
export async function handleImpact(request: Request) {
  const dict = await getDictionary();

  const session = await getSession();
  if (!session) {
    return Response.json(
      { error: dict.errors.signInRequired },
      { status: 401 },
    );
  }

  const keys = parseKeys(await request.json().catch(() => null));
  if (!keys) {
    return Response.json({ error: dict.errors.badRequest }, { status: 400 });
  }

  return Response.json({ data: await loadImpact(keys) });
}
