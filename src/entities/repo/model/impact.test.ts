import { describe, expect, it } from "vitest";
import {
  isNotable,
  MIN_STARS,
  NOTABLE_MIN,
  scoreRepo,
  WEIGHTS,
  type RepoSignals,
} from "@/entities/repo/model/impact";

const NOW = Date.parse("2026-08-15T00:00:00Z");

/** 외부 관심이 충분해 trust가 audience에 묶이지 않는 Repository. 신뢰 신호를 관찰할 수 있다. */
const BIG: RepoSignals = {
  isPrivate: false,
  stars: 50_000,
  forks: 10_000,
  isInOrganization: true,
  isFork: false,
  isArchived: false,
  hasLicense: true,
  createdAt: "2020-01-01T00:00:00Z",
  pushedAt: "2026-08-01T00:00:00Z",
};

const signals = (overrides: Partial<RepoSignals> = {}): RepoSignals => ({ ...BIG, ...overrides });

describe("scoreRepo · audience", () => {
  it("비공개 Repository는 신호가 아무리 좋아도 0점이다", () => {
    expect(scoreRepo(signals({ isPrivate: true }), NOW)).toBe(0);
  });

  it("외부 관심이 0이면 신뢰 신호가 완벽해도 0점이다", () => {
    expect(scoreRepo(signals({ stars: 0, forks: 0 }), NOW)).toBe(0);
  });

  it("Stars·Forks 만점이면 100점에 닿는다", () => {
    expect(scoreRepo(signals({ stars: 100_000, forks: 20_000 }), NOW)).toBe(100);
  });

  it("상한을 넘는 Stars·Forks도 100점을 넘기지 않는다", () => {
    expect(scoreRepo(signals({ stars: 5_000_000, forks: 900_000 }), NOW)).toBe(100);
  });

  it("Stars가 많을수록 점수가 오른다", () => {
    const at = (stars: number) => scoreRepo(signals({ stars }), NOW);
    expect(at(100)).toBeLessThan(at(1_000));
    expect(at(1_000)).toBeLessThan(at(10_000));
  });
});

describe("scoreRepo · trust", () => {
  it("trust는 audience를 넘겨 받지 못한다", () => {
    // audience 32점 · trust 40점인 Repository. 합이 72가 아니라 64여야 한다.
    const modest = signals({ stars: 600, forks: 100 });
    expect(scoreRepo(modest, NOW)).toBe(64);
  });

  it.each([
    ["90일 내 push", "2026-08-01T00:00:00Z", 96],
    ["1년 내 push", "2026-02-15T00:00:00Z", 88],
    ["1년보다 오래된 push", "2023-02-15T00:00:00Z", 80],
    ["push 기록 없음", null, 80],
  ])("활성도 — %s", (_label, pushedAt, expected) => {
    expect(scoreRepo(signals({ pushedAt }), NOW)).toBe(expected);
  });

  it("Organization 소유가 아니면 점수가 낮다", () => {
    expect(scoreRepo(signals({ isInOrganization: false }), NOW)).toBe(82);
  });

  it("업력 2년을 못 채우면 점수가 낮다", () => {
    expect(scoreRepo(signals({ createdAt: "2025-08-15T00:00:00Z" }), NOW)).toBe(86);
  });

  it("신뢰 신호가 전무하면 audience만 남는다", () => {
    const bare = signals({
      isInOrganization: false,
      createdAt: "2026-01-01T00:00:00Z",
      pushedAt: null,
    });
    expect(scoreRepo(bare, NOW)).toBe(56);
  });
});

describe("scoreRepo · 감점", () => {
  it("fork는 forkPenalty만큼 깎인다", () => {
    expect(scoreRepo(signals({ isFork: true }), NOW)).toBe(96 - WEIGHTS.forkPenalty);
  });

  it("archive된 Repository는 archivedPenalty만큼 깎인다", () => {
    expect(scoreRepo(signals({ isArchived: true }), NOW)).toBe(96 - WEIGHTS.archivedPenalty);
  });

  it("감점이 점수를 넘겨도 음수가 되지 않는다", () => {
    const small = signals({ stars: 40, forks: 2, isFork: true, isArchived: true });
    expect(scoreRepo(small, NOW)).toBe(0);
  });
});

describe("scoreRepo · 자격 조건", () => {
  it("License가 없으면 주요 OSS 경계 아래로 묶인다", () => {
    expect(scoreRepo(signals({ hasLicense: false }), NOW)).toBe(NOTABLE_MIN - 1);
  });

  it("Stars 최소선을 못 넘으면 주요 OSS 경계 아래로 묶인다", () => {
    // Forks·신뢰 신호를 최대로 줘도 Stars 29개로는 경계를 넘을 수 없다.
    const score = scoreRepo(signals({ stars: MIN_STARS - 1, forks: 20_000 }), NOW);
    expect(score).toBeLessThan(NOTABLE_MIN);
    expect(isNotable(score)).toBe(false);
  });

  it("Stars 최소선을 갓 넘긴 Repository는 자기 점수를 그대로 받는다", () => {
    expect(scoreRepo(signals({ stars: MIN_STARS, forks: 0 }), NOW)).toBe(27);
  });

  it("now를 생략하면 현재 시각을 쓴다", () => {
    expect(scoreRepo(signals({ stars: 0, forks: 0 }))).toBe(0);
  });
});

describe("isNotable", () => {
  it("경계값 기준으로 판정한다", () => {
    expect(isNotable(NOTABLE_MIN - 1)).toBe(false);
    expect(isNotable(NOTABLE_MIN)).toBe(true);
    expect(isNotable(100)).toBe(true);
  });
});
