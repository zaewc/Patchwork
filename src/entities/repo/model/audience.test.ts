import { describe, expect, it } from "vitest";
import { audienceScore, AUDIENCE_WEIGHTS } from "@/entities/repo/model/audience";

const MAX = AUDIENCE_WEIGHTS.stars + AUDIENCE_WEIGHTS.forks;

describe("audienceScore", () => {
  it("관심이 없으면 0점이다", () => {
    expect(audienceScore(0, 0)).toBe(0);
  });

  it("Stars·Forks 상한을 채우면 만점이다", () => {
    expect(audienceScore(100_000, 20_000)).toBeCloseTo(MAX, 5);
  });

  it("상한을 넘겨도 만점을 넘지 않는다", () => {
    expect(audienceScore(5_000_000, 900_000)).toBeCloseTo(MAX, 5);
  });

  it("주요 OSS 경계선(60점)에 겨우 닿을 뿐이다", () => {
    expect(MAX).toBe(60);
  });

  it("Stars에 Forks보다 큰 비중을 준다", () => {
    expect(audienceScore(1_000, 0)).toBeGreaterThan(audienceScore(0, 1_000));
  });

  it("많아질수록 오르지만 로그 스케일이다", () => {
    const at = (stars: number) => audienceScore(stars, 0);

    expect(at(100)).toBeLessThan(at(1_000));
    expect(at(1_000)).toBeLessThan(at(10_000));
    // 10배 늘 때마다 거의 같은 폭으로 오른다. star 1,000개를 더 받는 일의 무게가
    // 이미 10,000개인 프로젝트와 100개인 프로젝트에서 다르다는 뜻이다.
    expect(at(100) - at(10)).toBeCloseTo(at(10_000) - at(1_000), 0);
  });

  it("음수는 0으로 본다", () => {
    expect(audienceScore(-5, -5)).toBe(0);
  });
});
