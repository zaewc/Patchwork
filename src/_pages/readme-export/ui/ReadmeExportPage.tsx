import { redirect } from "next/navigation";
import { loadContributionItems } from "@/_pages/readme-export/api/load-contribution-items";
import { toMarkdown } from "@/_pages/readme-export/lib/to-markdown";
import type { ContributionGroup } from "@/entities/contribution";
import { getSession } from "@/entities/viewer";
import {
  filterByScope,
  parseScopeParams,
  ScopeTabs,
} from "@/features/contribution-scope";
import { SiteHeader } from "@/widgets/site-header";
import { GitHubAuthError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { errorMessage } from "@/shared/lib/error-message";
import { Banner } from "@/shared/ui/banner";
import { CopyButton } from "@/shared/ui/copy-button";

export async function ReadmeExportPage({ searchParams }: PageProps<"/export">) {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const params = parseScopeParams(await searchParams);

  let groups: ContributionGroup[] = [];
  let error: string | null = null;
  try {
    groups = await loadContributionItems(session.token, params.range);
  } catch (caught) {
    if (caught instanceof GitHubAuthError) redirect(ROUTES.login);
    error = errorMessage(caught, "기여 목록을 불러오지 못했습니다.");
  }

  const visible = filterByScope(groups, params.showAll);
  const markdown = toMarkdown(visible);
  const itemCount = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <SiteHeader user={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              README 내보내기
            </h1>
            <p className="mt-1 text-sm text-muted">
              merge된 pull request와 완료 처리된 issue를 repository별로 묶어
              Markdown으로 만듭니다.
            </p>
          </div>
          <ScopeTabs params={params} path={ROUTES.export} />
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
