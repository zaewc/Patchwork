import { redirect } from "next/navigation";
import { loadContributionItems } from "@/_pages/readme-export/api/loadContributionItems";
import { toMarkdown } from "@/_pages/readme-export/lib/toMarkdown";
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
import { interpolate } from "@/shared/lib/i18n";
import { getDictionary } from "@/shared/lib/i18n-server";
import { requestTheme } from "@/shared/lib/theme-server";
import { Banner } from "@/shared/ui/banner";
import { CopyButton } from "@/shared/ui/copy-button";

export async function ReadmeExportPage({ searchParams }: PageProps<"/export">) {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const [dict, theme] = await Promise.all([getDictionary(), requestTheme()]);
  const params = parseScopeParams(await searchParams);

  let groups: ContributionGroup[] = [];
  let error: string | null = null;
  try {
    groups = await loadContributionItems(session.token, params.range, dict);
  } catch (caught) {
    if (caught instanceof GitHubAuthError) redirect(ROUTES.login);
    error = errorMessage(caught, dict.export.loadFailed);
  }

  const visible = filterByScope(groups, params.showAll);
  const markdown = toMarkdown(visible);
  const itemCount = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <SiteHeader user={session} theme={theme} dict={dict} active="export" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {dict.export.title}
            </h1>
            <p className="mt-1 text-sm text-muted">{dict.export.subtitle}</p>
          </div>
          <ScopeTabs params={params} path={ROUTES.export} dict={dict} />
        </div>

        {error ? <Banner className="mt-6">{error}</Banner> : null}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {interpolate(dict.export.summary, {
              repos: visible.length,
              items: itemCount,
            })}
          </p>
          {markdown ? (
            <CopyButton
              text={markdown}
              label={dict.export.copy}
              copiedLabel={dict.export.copied}
            />
          ) : null}
        </div>

        {markdown ? (
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs leading-relaxed">
            {markdown}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {error ? dict.export.retry : dict.export.empty}
          </p>
        )}
      </main>
    </>
  );
}
