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
import { getDictionary } from "@/shared/lib/i18n-server";

export async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const dict = await getDictionary();
  const params = parseScopeParams(await searchParams);
  const { range } = params;

  const queryClient = makeQueryClient();
  try {
    await queryClient.fetchQuery<DashboardData>({
      queryKey: dashboardQueryKey(range),
      queryFn: () => loadDashboard(session.token, range, dict),
    });
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return (
        <ErrorScreen
          title={dict.dashboard.sessionExpired.title}
          body={dict.dashboard.sessionExpired.body}
          action={dict.dashboard.sessionExpired.action}
          href={ROUTES.login}
          dict={dict}
        />
      );
    }
    return (
      <ErrorScreen
        title={dict.dashboard.loadFailed.title}
        body={errorMessage(error, dict.dashboard.unknownError)}
        action={dict.dashboard.loadFailed.action}
        href={scopeHref(params, {}, ROUTES.dashboard)}
        dict={dict}
      />
    );
  }

  return (
    <DashboardQueryProvider>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* 첫 화면은 서버가 채워 주고, 이후 조회 조건은 브라우저가 들고 간다. */}
        <DashboardContent initialParams={params} dict={dict} />
      </HydrationBoundary>
    </DashboardQueryProvider>
  );
}
