import { loadDashboard } from "@/_pages/dashboard";
import { getSession } from "@/entities/viewer";
import { GitHubAuthError } from "@/shared/api";
import { parseRange } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { getDictionary } from "@/shared/lib/i18n-server";

/** 브라우저의 Query가 세션 토큰을 보지 않고 대시보드 데이터를 다시 읽는 통로. */
export async function handleDashboard(request: Request) {
  const [dict, session] = await Promise.all([getDictionary(), getSession()]);
  if (!session) {
    return Response.json(
      { error: dict.errors.signInRequired },
      { status: 401 },
    );
  }

  const range = parseRange(new URL(request.url).searchParams.get("range"));

  try {
    const data = await loadDashboard(session.token, range, dict);
    return Response.json({ data });
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json(
      { error: errorMessage(error, dict.errors.dashboardFailed) },
      { status: 502 },
    );
  }
}
