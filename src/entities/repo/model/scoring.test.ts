import { describe, expect, it } from "vitest";
import {
  scoringKeys,
  withImpact,
  type Unscored,
} from "@/entities/repo/model/scoring";

type Item = { name: string; impact: number };

const unscored = (key: string, isPrivate = false): Unscored<Item> => ({
  name: key,
  scoring: { key, signals: { isPrivate, stars: 50_000, forks: 10_000 } },
});

describe("withImpact", () => {
  it("Scorecard로 impact를 채우고 꼬리표를 떼어낸다", () => {
    const scored = withImpact<Item>(
      unscored("vercel/next.js"),
      new Map([["vercel/next.js", 6.2]]),
    );

    expect(scored).toEqual({ name: "vercel/next.js", impact: 62 });
    expect("scoring" in scored).toBe(false);
  });

  it("목록에 없는 repository는 모른다고 보고 대비책으로 매긴다", () => {
    const scored = withImpact<Item>(unscored("someone/unknown"), new Map());
    expect(scored.impact).toBe(56);
  });

  it("Scorecard가 명시적으로 null이어도 대비책으로 매긴다", () => {
    const scored = withImpact<Item>(
      unscored("someone/unknown"),
      new Map([["someone/unknown", null]]),
    );
    expect(scored.impact).toBe(56);
  });

  it("비공개 repository는 0점이다", () => {
    const scored = withImpact<Item>(unscored("acme/internal", true), new Map());
    expect(scored.impact).toBe(0);
  });

  it("다른 repository의 점수를 가져오지 않는다", () => {
    const scorecards = new Map([
      ["a/one", 9],
      ["b/two", 1],
    ]);

    expect(withImpact<Item>(unscored("a/one"), scorecards).impact).toBe(90);
    expect(withImpact<Item>(unscored("b/two"), scorecards).impact).toBe(10);
  });
});

describe("scoringKeys", () => {
  it("점수를 물을 repository 이름만 남긴다", () => {
    expect(
      scoringKeys([
        unscored("vercel/next.js").scoring,
        unscored("org/small").scoring,
      ]),
    ).toEqual(["vercel/next.js", "org/small"]);
  });

  it("같은 repository는 한 번만 묻는다", () => {
    expect(
      scoringKeys([
        unscored("vercel/next.js").scoring,
        unscored("vercel/next.js").scoring,
      ]),
    ).toEqual(["vercel/next.js"]);
  });

  /** 비공개 repository는 공개 생태계의 척도가 아니고 deps.dev에도 없다. */
  it("비공개 repository는 묻지 않는다", () => {
    expect(scoringKeys([unscored("acme/internal", true).scoring])).toEqual([]);
  });

  it("물을 것이 없으면 빈 목록이다", () => {
    expect(scoringKeys([])).toEqual([]);
  });
});
