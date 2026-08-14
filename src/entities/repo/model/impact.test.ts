import { describe, expect, it } from "vitest";
import { audienceScore } from "@/entities/repo/model/audience";
import { isNotable, NOTABLE_MIN, scoreRepo, type RepoSignals } from "@/entities/repo/model/impact";

const signals = (overrides: Partial<RepoSignals> = {}): RepoSignals => ({
  isPrivate: false,
  stars: 50_000,
  forks: 10_000,
  ...overrides,
});

describe("scoreRepo · 비공개", () => {
  it("비공개 Repository는 Scorecard가 있어도 0점이다", () => {
    expect(scoreRepo(signals({ isPrivate: true }), 9.5)).toBe(0);
  });

  it("비공개 Repository는 Stars가 많아도 0점이다", () => {
    expect(scoreRepo(signals({ isPrivate: true, stars: 200_000 }), null)).toBe(0);
  });
});

describe("scoreRepo · Scorecard가 있을 때", () => {
  it("총점을 100점으로 환산한다", () => {
    expect(scoreRepo(signals(), 6.2)).toBe(62);
    expect(scoreRepo(signals(), 8.5)).toBe(85);
  });

  it("0점과 만점도 그대로 옮긴다", () => {
    expect(scoreRepo(signals(), 0)).toBe(0);
    expect(scoreRepo(signals(), 10)).toBe(100);
  });

  it("소수점은 반올림한다", () => {
    expect(scoreRepo(signals(), 6.25)).toBe(63);
    expect(scoreRepo(signals(), 6.24)).toBe(62);
  });

  it("Stars가 아무리 많아도 Scorecard가 답이다", () => {
    expect(scoreRepo(signals({ stars: 300_000, forks: 90_000 }), 1.9)).toBe(19);
  });

  it("Stars가 없어도 Scorecard가 좋으면 높다", () => {
    // Scorecard는 "널리 쓰이는가"가 아니라 "잘 관리되는가"를 잰다.
    expect(scoreRepo(signals({ stars: 20, forks: 1 }), 7.4)).toBe(74);
  });
});

describe("scoreRepo · Scorecard가 없을 때", () => {
  it("외부 관심의 크기로 짐작한다", () => {
    const repo = signals();
    expect(scoreRepo(repo, null)).toBe(Math.round(audienceScore(repo.stars, repo.forks)));
  });

  it("관심이 없으면 0점이다", () => {
    expect(scoreRepo(signals({ stars: 0, forks: 0 }), null)).toBe(0);
  });

  it("검증되지 않았으므로 경계선을 겨우 넘길 뿐이다", () => {
    expect(scoreRepo(signals({ stars: 500_000, forks: 100_000 }), null)).toBe(NOTABLE_MIN);
  });

  it("작은 repository는 낮게 남는다", () => {
    expect(scoreRepo(signals({ stars: 2, forks: 0 }), null)).toBeLessThan(NOTABLE_MIN);
  });
});

describe("isNotable", () => {
  it("경계값 기준으로 판정한다", () => {
    expect(isNotable(NOTABLE_MIN - 1)).toBe(false);
    expect(isNotable(NOTABLE_MIN)).toBe(true);
    expect(isNotable(100)).toBe(true);
  });

  it("Scorecard 6.0이 경계선이다", () => {
    expect(isNotable(scoreRepo(signals(), 6.0))).toBe(true);
    expect(isNotable(scoreRepo(signals(), 5.9))).toBe(false);
  });
});
