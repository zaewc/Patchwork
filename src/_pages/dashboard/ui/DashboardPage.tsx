import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { dashboardQueryKey } from "@/_pages/dashboard/api/dashboardQuery";
import {
  loadDashboard,
  type DashboardData,
} from "@/_pages/dashboard/api/loadDashboard";
import { DashboardContent } from "@/_pages/dashboard/ui/DashboardContent";
import { DashboardQueryProvider } from "@/_pages/dashboard/ui/DashboardQueryProvider";
import { ErrorScreen } from "@/_pages/dashboard/ui/ErrorScreen";
import { getSession } from "@/entities/viewer";
import { parseScopeParams, scopeHref } from "@/features/contribution-scope";
import { GitHubAuthError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { makeQueryClient } from "@/shared/lib/query-client";

export async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const params = parseScopeParams(await searchParams);
  const { range } = params;

  const queryClient = makeQueryClient();
  try {
    await queryClient.fetchQuery<DashboardData>({
      queryKey: dashboardQueryKey(range),
      queryFn: () => loadDashboard(session.token, range),
    });
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return (
        <ErrorScreen
          title="세션이 만료되었습니다"
          body="GitHub 토큰이 더 이상 유효하지 않습니다."
          action="다시 로그인"
          href={ROUTES.login}
        />
      );
    }
    return (
      <ErrorScreen
        title="데이터를 불러오지 못했습니다"
        body={errorMessage(error, "알 수 없는 오류가 발생했습니다.")}
        action="다시 시도"
        href={scopeHref(params, {}, ROUTES.dashboard)}
      />
    );
  }

  return (
    <DashboardQueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* 첫 화면은 서버가 채워 주고, 이후 조회 조건은 브라우저가 들고 간다. */}
        <DashboardContent initialParams={params} />
      </HydrationBoundary>
    </DashboardQueryProvider>
  );
}
