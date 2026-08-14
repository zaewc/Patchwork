import { redirect } from "next/navigation";
import { Banner } from "@/components/banner";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/tab-bar";
import { dashboardHref, parseDashboardParams } from "@/lib/dashboard-params";
import {
  fetchContributionItems,
  GitHubAuthError,
  RANGES,
  type ContributionGroup,
  type RangeKey,
} from "@/lib/github";
import { isNotable } from "@/lib/impact";
import { toMarkdown } from "@/lib/readme";
import { getSession } from "@/lib/session";

const PATH = "/export";

export default async function ExportPage({ searchParams }: PageProps<"/export">) {
  const session = await getSession();
  if (!session) redirect("/");

  const params = parseDashboardParams(await searchParams);
  const { range, showAll } = params;

  let groups: ContributionGroup[];
  let error: string | null = null;
  try {
    groups = await fetchContributionItems(session.token, range);
  } catch (caught) {
    if (caught instanceof GitHubAuthError) redirect("/api/auth/login");
    groups = [];
    error = caught instanceof Error ? caught.message : "기여 목록을 불러오지 못했습니다.";
  }

  const visible = showAll ? groups : groups.filter((group) => isNotable(group.impact));
  const markdown = toMarkdown(visible);
  const itemCount = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <SiteHeader user={{ login: session.login, name: session.name, avatarUrl: session.avatarUrl }} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">README 내보내기</h1>
            <p className="mt-1 text-sm text-muted">
              merge된 pull request와 완료 처리된 issue를 repository별로 묶어 Markdown으로 만듭니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TabBar
              items={[false, true].map((all) => ({
                href: dashboardHref(params, { showAll: all }, PATH),
                label: all ? "전체" : "주요 OSS",
                active: all === showAll,
              }))}
            />
            <TabBar
              items={(Object.keys(RANGES) as RangeKey[]).map((key) => ({
                href: dashboardHref(params, { range: key }, PATH),
                label: RANGES[key].label,
                active: key === range,
              }))}
            />
          </div>
        </div>

        {error ? <Banner className="mt-6">{error}</Banner> : null}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            repository {visible.length}곳 · {itemCount}건
          </p>
          {markdown ? <CopyButton text={markdown} /> : null}
        </div>

        {markdown ? (
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs leading-relaxed">
            {markdown}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {error
              ? "다시 시도해 주세요."
              : "이 기간에 merge된 pull request나 완료된 issue가 없습니다. 기간을 넓히거나 전체로 전환해 보세요."}
          </p>
        )}
      </main>
    </>
  );
}
