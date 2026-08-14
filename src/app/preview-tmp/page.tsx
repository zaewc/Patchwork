import Link from "next/link";
import { RepoTable } from "@/components/repo-table";
import type { RepoStat } from "@/lib/github";
import { isNotableTier, scoreRepo, tierOf } from "@/lib/impact";

const now = Date.now();
const yr = (n: number) => new Date(now - n * 365 * 86400000).toISOString();

const raw = [
  { n: "vercel/next.js", stars: 128000, forks: 27000, org: true, priv: false, ext: true, lic: true, c: [42, 7, 12, 3] },
  { n: "sohee/patchwork", stars: 12, forks: 1, org: false, priv: false, ext: false, lic: true, c: [51, 2, 0, 1] },
  { n: "prisma/prisma", stars: 40000, forks: 1600, org: true, priv: false, ext: true, lic: true, c: [9, 3, 5, 2] },
  { n: "acme/internal-api", stars: 0, forks: 0, org: true, priv: true, ext: true, lic: true, c: [11, 4, 1, 0] },
  { n: "sohee/algo-study", stars: 45, forks: 30, org: false, priv: false, ext: false, lic: false, c: [7, 0, 0, 0] },
  { n: "acme/design-tokens", stars: 60, forks: 8, org: true, priv: false, ext: true, lic: true, c: [6, 2, 0, 1] },
];

const repos: RepoStat[] = raw.map((r) => {
  const impact = scoreRepo({ isPrivate: r.priv, stars: r.stars, forks: r.forks, isInOrganization: r.org, isFork: false, isArchived: false, hasLicense: r.lic, createdAt: yr(6), pushedAt: yr(0.01) }, now);
  const [commits, pullRequests, reviews, issues] = r.c;
  return { nameWithOwner: r.n, url: "#", isPrivate: r.priv, isExternal: r.ext, impact, tier: tierOf(impact), commits, pullRequests, reviews, issues, total: commits + pullRequests + reviews + issues };
});

const notable = repos.filter((r) => isNotableTier(r.tier));

function Block({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const link = (t: string) => (
  <Link href="#" className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">{t}</Link>
);

export default function P() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <p className="text-xs text-muted">기본 상태 ↓</p>
      <Block title="Repositories · 주요 OSS" action={link(`전체 보기 (${repos.length}곳)`)}>
        <RepoTable repos={notable} emptyMessage="이 기간에 주요 OSS 기여가 없습니다. 전체 보기로 확인하세요." />
      </Block>
      <p className="mt-12 text-xs text-muted">전체 보기 ↓</p>
      <Block title="Repositories · 전체" action={link(`주요 OSS만 (${notable.length}곳)`)}>
        <RepoTable repos={repos} />
      </Block>
      <p className="mt-12 text-xs text-muted">주요 OSS 기여가 하나도 없을 때 ↓</p>
      <Block title="Repositories · 주요 OSS" action={link("전체 보기 (6곳)")}>
        <RepoTable repos={[]} emptyMessage="이 기간에 주요 OSS 기여가 없습니다. 전체 보기로 확인하세요." />
      </Block>
      <p className="mt-8 font-mono text-[11px] text-muted">
        {repos.map((r) => `${r.nameWithOwner}=${r.impact}`).join("  ·  ")}
      </p>
    </main>
  );
}
