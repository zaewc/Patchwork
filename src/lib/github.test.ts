import { describe, expect, it } from "vitest";
import {
  calendarWeeks,
  collection,
  entry,
  repoRef,
  toyRepoRef,
} from "@/lib/__fixtures__/github";
import { aggregateRepos, mergeCalendars, parseRange, RANGES, windowsFor } from "@/lib/github";

const NOW = Date.parse("2026-08-15T00:00:00Z");
const DAY = 86_400_000;

describe("parseRange", () => {
  it.each(Object.keys(RANGES))("아는 값 %s 은 그대로 통과한다", (key) => {
    expect(parseRange(key)).toBe(key);
  });

  it.each([["10y"], [""], [null], [undefined], [30], [{ range: "30d" }], [["30d"]]])(
    "모르는 값 %s 은 1y로 떨어진다",
    (value) => {
      expect(parseRange(value)).toBe("1y");
    },
  );
});

describe("windowsFor", () => {
  it("1년 이하 범위는 창 하나로 끝난다", () => {
    for (const range of ["30d", "90d", "1y"] as const) {
      const windows = windowsFor(range, NOW);
      expect(windows).toHaveLength(1);
      expect(windows[0].to.getTime()).toBe(NOW);
      expect(windows[0].from.getTime()).toBe(NOW - RANGES[range].days * DAY);
    }
  });

  it("5년은 1년짜리 창 5개로 쪼갠다", () => {
    const windows = windowsFor("5y", NOW);
    expect(windows).toHaveLength(5);
    for (const window of windows) {
      expect(window.to.getTime() - window.from.getTime()).toBe(365 * DAY);
    }
  });

  it("창은 과거에서 현재 순서이고 서로 겹치지 않는다", () => {
    const windows = windowsFor("5y", NOW);
    expect(windows.at(-1)!.to.getTime()).toBe(NOW);

    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].from.getTime()).toBeGreaterThan(windows[i - 1].to.getTime());
      // 앞 창의 끝과 뒤 창의 시작이 1ms만 떨어져 있어야 기간에 구멍이 없다.
      expect(windows[i].from.getTime() - windows[i - 1].to.getTime()).toBe(1);
    }
  });

  it("전체 범위가 요청한 일수를 덮는다", () => {
    const windows = windowsFor("5y", NOW);
    const covered = windows.at(-1)!.to.getTime() - windows[0].from.getTime();
    expect(covered).toBe(RANGES["5y"].days * DAY + (windows.length - 1));
  });
});

describe("aggregateRepos", () => {
  const next = repoRef("vercel/next.js");
  const mine = repoRef("octocat/mine", { owner: { login: "octocat", avatarUrl: "a" } });

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
      NOW,
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
    expect(repos[0].impact).toBeGreaterThanOrEqual(60);
  });

  it("여러 조회 창의 같은 repository를 더한다", () => {
    const repos = aggregateRepos(
      [
        collection({ commitContributionsByRepository: [entry(next, 10)] }),
        collection({ commitContributionsByRepository: [entry(next, 7)] }),
      ],
      "octocat",
      NOW,
    );

    expect(repos[0].commits).toBe(17);
    expect(repos[0].total).toBe(17);
  });

  it("내 소유 repository는 외부로 세지 않는다 (대소문자 무시)", () => {
    const repos = aggregateRepos(
      [collection({ commitContributionsByRepository: [entry(mine, 1), entry(next, 1)] })],
      "OCTOCAT",
      NOW,
    );

    expect(repos.find((r) => r.nameWithOwner === "octocat/mine")!.isExternal).toBe(false);
    expect(repos.find((r) => r.nameWithOwner === "vercel/next.js")!.isExternal).toBe(true);
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
      NOW,
    );

    expect(repos.map((r) => r.nameWithOwner)).toEqual(["c/three", "a/one", "b/two"]);
  });

  it("주요 OSS가 아닌 repository도 목록에는 담는다", () => {
    const repos = aggregateRepos(
      [collection({ commitContributionsByRepository: [entry(toyRepoRef("me/toy"), 3)] })],
      "octocat",
      NOW,
    );

    expect(repos[0].impact).toBeLessThan(60);
    expect(repos[0].total).toBe(3);
  });

  it("now를 생략해도 동작한다", () => {
    const repos = aggregateRepos(
      [collection({ commitContributionsByRepository: [entry(next, 1)] })],
      "octocat",
    );
    expect(repos[0].total).toBe(1);
  });

  describe("상한에 걸려 목록이 잘린 경우", () => {
    /** commits는 상한 100, 나머지는 50이다. */
    const many = (count: number, prefix: string) =>
      Array.from({ length: count }, (_, i) =>
        entry(repoRef(`org${prefix}${String(i).padStart(3, "0")}/repo`), 1),
      );

    it("잘린 항목 목록에 없던 repository는 그 항목을 null로 둔다", () => {
      const commits = many(100, "c");
      const repos = aggregateRepos(
        [
          collection({
            commitContributionsByRepository: commits,
            // PR 목록에만 등장하는 repository. commit 목록(상한 도달)에는 없다.
            pullRequestContributionsByRepository: [entry(repoRef("only/pr"), 4)],
          }),
        ],
        "octocat",
        NOW,
      );

      const onlyPr = repos.find((r) => r.nameWithOwner === "only/pr")!;
      expect(onlyPr.commits).toBeNull();
      expect(onlyPr.pullRequests).toBe(4);

      const listed = repos.find((r) => r.nameWithOwner === "orgc000/repo")!;
      expect(listed.commits).toBe(1);
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
        NOW,
      );

      expect(repos.find((r) => r.nameWithOwner === "only/commit")!.issues).toBeNull();
      expect(repos.find((r) => r.nameWithOwner === "orgi000/repo")!.issues).toBe(1);
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
        NOW,
      );

      expect(repos.every((r) => r.commits !== null && r.issues !== null)).toBe(true);
    });

    it("창 하나에서만 잘려도 구멍으로 잡는다", () => {
      const repos = aggregateRepos(
        [
          collection({ commitContributionsByRepository: many(100, "c") }),
          collection({ commitContributionsByRepository: [entry(repoRef("late/repo"), 5)] }),
        ],
        "octocat",
        NOW,
      );

      expect(repos.find((r) => r.nameWithOwner === "late/repo")!.commits).toBeNull();
    });
  });
});

describe("mergeCalendars", () => {
  it("날짜별 기여 수를 그대로 옮긴다", () => {
    // 2026-08-09는 일요일이다.
    const weeks = mergeCalendars([
      collection({
        contributionCalendar: {
          totalContributions: 6,
          weeks: calendarWeeks("2026-08-09", [1, 2, 3]),
        },
      }),
    ]);

    expect(weeks).toEqual([
      [
        { date: "2026-08-09", count: 1, weekday: 0 },
        { date: "2026-08-10", count: 2, weekday: 1 },
        { date: "2026-08-11", count: 3, weekday: 2 },
      ],
    ]);
  });

  it("일요일마다 새 주를 시작한다", () => {
    const weeks = mergeCalendars([
      collection({
        contributionCalendar: {
          totalContributions: 0,
          weeks: calendarWeeks("2026-08-09", Array.from({ length: 15 }, () => 0)),
        },
      }),
    ]);

    expect(weeks.map((week) => week.length)).toEqual([7, 7, 1]);
    expect(weeks.map((week) => week[0].weekday)).toEqual([0, 0, 0]);
  });

  it("일요일이 아닌 날부터 시작해도 첫 주를 만든다", () => {
    const weeks = mergeCalendars([
      collection({
        contributionCalendar: {
          totalContributions: 0,
          weeks: calendarWeeks("2026-08-12", [0, 0, 0, 0, 0]),
        },
      }),
    ]);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toHaveLength(4);
    expect(weeks[0][0].weekday).toBe(3);
  });

  it("창 경계에서 겹친 날짜는 하나로 합친다", () => {
    const shared = calendarWeeks("2026-08-09", [1, 2, 3]);
    const weeks = mergeCalendars([
      collection({ contributionCalendar: { totalContributions: 6, weeks: shared } }),
      collection({ contributionCalendar: { totalContributions: 6, weeks: shared } }),
    ]);

    expect(weeks.flat()).toHaveLength(3);
    expect(weeks.flat().reduce((sum, day) => sum + day.count, 0)).toBe(6);
  });

  it("날짜순으로 다시 줄 세운다", () => {
    const weeks = mergeCalendars([
      collection({
        contributionCalendar: { totalContributions: 0, weeks: calendarWeeks("2026-08-16", [4]) },
      }),
      collection({
        contributionCalendar: { totalContributions: 0, weeks: calendarWeeks("2026-08-09", [1]) },
      }),
    ]);

    expect(weeks.flat().map((day) => day.date)).toEqual(["2026-08-09", "2026-08-16"]);
  });

  it("달력이 비어 있으면 빈 배열이다", () => {
    expect(mergeCalendars([collection()])).toEqual([]);
    expect(mergeCalendars([])).toEqual([]);
  });
});
