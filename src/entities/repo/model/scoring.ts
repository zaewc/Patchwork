import { scoreRepo, type RepoSignals } from "@/entities/repo/model/impact";

/** 점수를 매기는 데 필요한 것: 어느 repository인지와 그 신호 */
export type RepoScoring = { key: string; signals: RepoSignals };

/**
 * impact를 아직 채우지 못한 값.
 *
 * 점수는 deps.dev 조회를 거쳐야 나오므로, GitHub 응답을 옮기는 단계에서는 매길 수 없다.
 * 그래서 두 단계로 나눈다: 먼저 이 모양으로 만들고, scorecard를 받은 뒤 withImpact로 완성한다.
 */
export type Unscored<T extends { impact: number }> = Omit<T, "impact"> & {
  scoring: RepoScoring;
};

/** repository 이름 → Scorecard 총점(0~10). null은 "deps.dev가 모른다". */
export type ScorecardIndex = ReadonlyMap<string, number | null>;

export function withImpact<T extends { impact: number }>(
  item: Unscored<T>,
  scorecards: ScorecardIndex,
): T {
  const { scoring, ...rest } = item;
  return {
    ...rest,
    impact: scoreRepo(scoring.signals, scorecards.get(scoring.key) ?? null),
  } as unknown as T;
}
