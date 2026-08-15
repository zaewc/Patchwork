import { describe, expect, it } from "vitest";
import { aggregateRepos } from "@/entities/contribution/lib/aggregate-repos";
import {
  collection,
  entry,
  repoRef,
  toyRepoRef,
} from "@/shared/api/github/response.fixtures";

const next = repoRef("vercel/next.js");
const mine = repoRef("octocat/mine", {
  owner: { login: "octocat", avatarUrl: "a" },
});

describe("aggregateRepos", () => {
  it("네 항목을 repository별로 합치고 total을 낸다", () => {
    const repos = aggregateRepos(
      [
        collection({
          commitContributionsByRepository: [entry(next, 10)],
          pullRequestContributionsByRepository: [entry(next, 3)],
          pullRequestReviewContributionsByRepository: [entry(next, 2)],
          issueContributionsByRepository: [entry(next, 1)],
        }),
      ],
      "octocat",
    );

    expect(repos).toHaveLength(1);
    expect(repos[0]).toMatchObject({
      nameWithOwner: "vercel/next.js",
      url: "https://github.com/vercel/next.js",
      ownerAvatarUrl: "https://avatars.githubusercontent.com/vercel",
      isPrivate: false,
      isExternal: true,
      commits: 10,
      pullRequests: 3,
      reviews: 2,
      issues: 1,
      total: 16,
    });
    // 점수는 여기서 매기지 않는다. 나중에 채울 꼬리표만 달려 있다.
    expect(repos[0]!.scoring).toEqual({
      key: "vercel/next.js",
      signals: { isPrivate: false, stars: 50_000, forks: 10_000 },
    });
  });

  it("여러 조회 창의 같은 repository를 더한다", () => {
    const repos = aggregateRepos(
      [
        collection({ commitContributionsByRepository: [entry(next, 10)] }),
        collection({ commitContributionsByRepository: [entry(next, 7)] }),
      ],
      "octocat",
    );

    expect(repos[0]!.commits).toBe(17);
    expect(repos[0]!.total).toBe(17);
  });

  it("기여가 없는 항목은 0으로 둔다", () => {
    const repos = aggregateRepos(
      [collection({ commitContributionsByRepository: [entry(next, 5)] })],
      "octocat",
    );

    expect(repos[0]).toMatchObject({
      commits: 5,
      pullRequests: 0,
      reviews: 0,
      issues: 0,
    });
  });

  it("내 소유 repository는 외부로 세지 않는다 (대소문자 무시)", () => {
    const repos = aggregateRepos(
      [
        collection({
          commitContributionsByRepository: [entry(mine, 1), entry(next, 1)],
        }),
      ],
      "OCTOCAT",
    );

    expect(
      repos.find((r) => r.nameWithOwner === "octocat/mine")!.isExternal,
    ).toBe(false);
    expect(
      repos.find((r) => r.nameWithOwner === "vercel/next.js")!.isExternal,
    ).toBe(true);
  });

  it("total 내림차순, 동점이면 이름 오름차순으로 정렬한다", () => {
    const repos = aggregateRepos(
      [
        collection({
          commitContributionsByRepository: [
            entry(repoRef("b/two"), 5),
            entry(repoRef("a/one"), 5),
            entry(repoRef("c/three"), 9),
          ],
        }),
      ],
      "octocat",
    );

    expect(repos.map((r) => r.nameWithOwner)).toEqual([
      "c/three",
      "a/one",
      "b/two",
    ]);
  });

  it("작은 repository도 목록에는 담는다 (걸러내는 곳은 화면이다)", () => {
    const repos = aggregateRepos(
      [
        collection({
          commitContributionsByRepository: [entry(toyRepoRef("me/toy"), 3)],
        }),
      ],
      "octocat",
    );

    expect(repos[0]!.scoring.signals).toEqual({
      isPrivate: false,
      stars: 2,
      forks: 0,
    });
    expect(repos[0]!.total).toBe(3);
  });

  it("비공개 repository의 신호도 그대로 옮긴다", () => {
    const repos = aggregateRepos(
      [
        collection({
          commitContributionsByRepository: [
            entry(repoRef("acme/internal", { isPrivate: true }), 5),
          ],
        }),
      ],
      "octocat",
    );

    expect(repos[0]!.scoring.signals.isPrivate).toBe(true);
  });

  it("기여가 없으면 빈 목록이다", () => {
    expect(aggregateRepos([collection()], "octocat")).toEqual([]);
    expect(aggregateRepos([], "octocat")).toEqual([]);
  });

  describe("상한에 걸려 목록이 잘린 경우", () => {
    /** commits는 상한 100, 나머지는 50이다. */
    const many = (count: number, prefix: string) =>
      Array.from({ length: count }, (_, i) =>
        entry(repoRef(`org${prefix}${String(i).padStart(3, "0")}/repo`), 1),
      );

    it("잘린 항목 목록에 없던 repository는 그 항목을 null로 둔다", () => {
      const repos = aggregateRepos(
        [
          collection({
            commitContributionsByRepository: many(100, "c"),
            // PR 목록에만 등장하는 repository. commit 목록(상한 도달)에는 없다.
            pullRequestContributionsByRepository: [
              entry(repoRef("only/pr"), 4),
            ],
          }),
        ],
        "octocat",
      );

      const onlyPr = repos.find((r) => r.nameWithOwner === "only/pr")!;
      expect(onlyPr.commits).toBeNull();
      expect(onlyPr.pullRequests).toBe(4);

      expect(
        repos.find((r) => r.nameWithOwner === "orgc000/repo")!.commits,
      ).toBe(1);
    });

    it("보조 항목은 상한 50에서 잘린 것으로 본다", () => {
      const repos = aggregateRepos(
        [
          collection({
            commitContributionsByRepository: [entry(repoRef("only/commit"), 2)],
            issueContributionsByRepository: many(50, "i"),
          }),
        ],
        "octocat",
      );

      expect(
        repos.find((r) => r.nameWithOwner === "only/commit")!.issues,
      ).toBeNull();
      expect(
        repos.find((r) => r.nameWithOwner === "orgi000/repo")!.issues,
      ).toBe(1);
    });

    it("상한에 닿지 않으면 아무 항목도 null이 되지 않는다", () => {
      const repos = aggregateRepos(
        [
          collection({
            commitContributionsByRepository: many(99, "c"),
            issueContributionsByRepository: many(49, "i"),
          }),
        ],
        "octocat",
      );

      expect(repos.every((r) => r.commits !== null && r.issues !== null)).toBe(
        true,
      );
    });

    it("창 하나에서만 잘려도 구멍으로 잡는다", () => {
      const repos = aggregateRepos(
        [
          collection({ commitContributionsByRepository: many(100, "c") }),
          collection({
            commitContributionsByRepository: [entry(repoRef("late/repo"), 5)],
          }),
        ],
        "octocat",
      );

      expect(
        repos.find((r) => r.nameWithOwner === "late/repo")!.commits,
      ).toBeNull();
    });
  });
});
