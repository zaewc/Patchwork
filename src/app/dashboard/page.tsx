import { redirect } from "next/navigation";
import { ContributionQuilt } from "@/components/contribution-quilt";
import { MergedPullRequests, PullRequestBoard } from "@/components/pull-request-board";
import { RangeTabs } from "@/components/range-tabs";
import { RepoTable } from "@/components/repo-table";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/format";
import {
  fetchDashboard,
  GitHubAuthError,
  parseRange,
  RANGES,
  type DashboardData,
} from "@/lib/github";
import { getSession } from "@/lib/session";

const TOP_REPOS = 15;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ErrorScreen({
  title,
  body,
  retry,
  href,
}: {
  title: string;
  body: string;
  retry: string;
  href: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <a
          href={href}
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {retry}
        </a>
      </main>
    </>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/");

  const range = parseRange((await searchParams).range);

  let data: DashboardData;
  try {
    data = await fetchDashboard(session.token, range);
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return (
        <ErrorScreen
          title="세션이 만료되었습니다"
          body="GitHub 토큰이 더 이상 유효하지 않습니다. 다시 로그인해 주세요."
          retry="다시 로그인"
          href="/api/auth/login"
        />
      );
    }
    return (
      <ErrorScreen
        title="데이터를 불러오지 못했습니다"
        body={error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
        retry="다시 시도"
        href={`/dashboard?range=${range}`}
      />
    );
  }

  const { viewer, totals, external, notable, streak, repos, openPullRequests, mergedPullRequests } =
    data;
  const staleCount = openPullRequests.filter((pr) => pr.isStale).length;
  const needsAction = openPullRequests.filter(
    (pr) => !pr.isDraft && pr.reviewDecision === "CHANGES_REQUESTED",
  ).length;
  const topRepos = repos.slice(0, TOP_REPOS);
  const rangeLabel = RANGES[range].label;

  return (
    <>
      <SiteHeader user={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {viewer.name ?? viewer.login}님의 조각보
            </h1>
            <p className="mt-1 text-sm text-muted">
              {rangeLabel} 동안 {formatNumber(totals.contributions)}건을 기여했고, 외부 저장소 기여{" "}
              {formatNumber(external.contributions)}건 가운데{" "}
              <span className="font-medium text-accent">
                {formatNumber(notable.contributions)}건
              </span>
              이 주요 OSS 기여입니다
              {notable.topRepo ? ` (대표: ${notable.topRepo})` : ""}.
            </p>
          </div>
          <RangeTabs current={range} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="총 기여"
            value={totals.contributions}
            hint={totals.restricted > 0 ? `비공개 ${formatNumber(totals.restricted)}건 포함` : rangeLabel}
          />
          <StatCard
            label="주요 OSS 기여"
            value={notable.contributions}
            hint={`${notable.repos}개 저장소 · 전체의 ${notable.ratio}%`}
            accent
          />
          <StatCard
            label="외부 저장소 기여"
            value={external.contributions}
            hint={`${external.repos}개 저장소 · 전체의 ${external.ratio}%`}
          />
          <StatCard label="올린 PR" value={totals.pullRequests} hint={`머지 ${data.mergedCount}건`} />
          <StatCard label="커밋" value={totals.commits} hint={`코드 리뷰 ${totals.reviews}건`} />
          <StatCard
            label="연속 기여"
            value={`${streak.current}일`}
            hint={`최장 ${streak.longest}일`}
          />
        </div>

        <Section title="기여 조각보" description={`${rangeLabel}의 일별 기여량`}>
          <div className="rounded-xl border border-border bg-surface p-4">
            <ContributionQuilt weeks={data.weeks} />
          </div>
        </Section>

        {data.pullRequestsError ? (
          <p className="mt-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-warn">
            PR 목록만 불러오지 못했습니다 — {data.pullRequestsError} 나머지 지표는 정상입니다.
          </p>
        ) : null}

        <Section
          title="열린 PR 상태"
          description={
            openPullRequests.length === 0
              ? "현재 열려 있는 PR이 없습니다."
              : `열린 PR ${formatNumber(data.openCount)}건${
                  needsAction > 0 ? ` · 내 조치 필요 ${needsAction}건` : ""
                }${staleCount > 0 ? ` · 2주 이상 정체 ${staleCount}건` : ""}`
          }
        >
          <PullRequestBoard pullRequests={openPullRequests} />
        </Section>

        <Section
          title="저장소별 기여"
          description={`${
            repos.length > TOP_REPOS
              ? `상위 ${TOP_REPOS}곳 (전체 ${repos.length}곳)`
              : `기여한 저장소 ${repos.length}곳`
          } · 등급은 스타·참여자 수·조직 소유·성숙도·활성도를 합산한 추정치입니다`}
        >
          <RepoTable repos={topRepos} />
        </Section>

        <Section title="최근 머지된 PR" description={`${rangeLabel} 기준`}>
          <MergedPullRequests pullRequests={mergedPullRequests} />
        </Section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        데이터 출처: GitHub GraphQL API · 페이지를 새로고침하면 최신 상태로 갱신됩니다.
      </footer>
    </>
  );
}
