import { describe, expect, it } from "vitest";
import {
  dashboardFixture,
  repoStat,
} from "@/_pages/dashboard/api/dashboard.fixtures";
import { dashboardView } from "@/_pages/dashboard/lib/dashboardView";

const NEXT_JS = "vercel/next.js";
const TOY = "someone/toy";

/** 점수표만 바꿔 가며 같은 핵심 데이터를 완성해 본다. */
const view = (scores: [string, number | null][]) =>
  dashboardView(dashboardFixture().core, new Map(scores));

describe("dashboardView", () => {
  it("Scorecard 총점을 100점으로 환산해 세 목록 모두에 붙인다", () => {
    const completed = view([
      [NEXT_JS, 8],
      [TOY, 1],
    ]);

    expect(completed.repos.map((repo) => repo.impact)).toEqual([80, 10]);
    expect(completed.openPullRequests.map((pr) => pr.impact)).toEqual([80, 10]);
    expect(completed.mergedPullRequests.map((pr) => pr.impact)).toEqual([80]);
  });

  it("꼬리표는 떼어 낸다", () => {
    expect("scoring" in view([[NEXT_JS, 8]]).repos[0]!).toBe(false);
  });

  it("점수를 매긴 뒤에 주요 OSS 기여를 센다", () => {
    expect(
      view([
        [NEXT_JS, 8],
        [TOY, 1],
      ]).notable,
    ).toEqual({ repos: 1, contributions: 100 });
  });

  it("Scorecard가 경계선 아래로 내려가면 주요 OSS에서 빠진다", () => {
    expect(view([[NEXT_JS, 3]]).notable).toEqual({
      repos: 0,
      contributions: 0,
    });
  });

  /** 내가 만든 repository는 아무리 잘 관리돼도 "외부 기여"가 아니다. */
  it("내 소유 repository는 점수가 높아도 주요 OSS 기여로 세지 않는다", () => {
    const core = dashboardFixture({
      repos: [
        repoStat({
          nameWithOwner: "octocat/mine",
          isExternal: false,
          total: 70,
        }),
      ],
    }).core;

    expect(dashboardView(core, new Map([["octocat/mine", 9]])).notable).toEqual(
      {
        repos: 0,
        contributions: 0,
      },
    );
  });

  it("핵심 데이터의 나머지는 그대로 통과시킨다", () => {
    const { core } = dashboardFixture();
    const completed = dashboardView(core, new Map());

    expect(completed.viewer).toEqual(core.viewer);
    expect(completed.totals).toEqual(core.totals);
    expect(completed.external).toEqual(core.external);
    expect(completed.weeks).toEqual(core.weeks);
    expect(completed.openCount).toBe(core.openCount);
  });
});
