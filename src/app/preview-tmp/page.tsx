import { RepoTable } from "@/components/repo-table";
import type { RepoStat } from "@/lib/github";

const r = (n: string, a: string, c: number | null, p: number | null, rv: number | null, i: number | null): RepoStat => ({
  nameWithOwner: n, url: "#", ownerAvatarUrl: `https://github.com/${a}.png?size=64`,
  isPrivate: false, isExternal: true, impact: 95,
  commits: c, pullRequests: p, reviews: rv, issues: i,
  total: [c, p, rv, i].reduce<number>((s, v) => s + (v ?? 0), 0),
});

const repos = [
  r("vercel/next.js", "vercel", 42, 7, 12, 3),
  r("prisma/prisma", "prisma", null, 9, 4, 2),
  r("rust-lang/rust", "rust-lang", 2, 3, 0, 0),
  r("kubernetes/kubernetes", "kubernetes", 0, 1, 0, 5),
];

export default function P() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h2 className="mb-3 text-sm font-medium text-muted">Repositories</h2>
      <RepoTable repos={repos} />
      <p className="mt-4 text-xs text-muted">
        prisma = 상한에 걸려 모름(—), kubernetes = 진짜 0, rust-lang = 커밋 2건
      </p>
    </main>
  );
}
