import type {
  RepoScoring,
  ScorecardIndex,
} from "@/entities/repo/model/scoring";
import { fetchDepsDevProject } from "@/shared/api";
import { mapInBatches } from "@/shared/lib/concurrency";

/** deps.dev를 한 번에 이만큼만 동시에 두드린다. */
const BATCH_SIZE = 16;

/**
 * 필요한 repository들의 OpenSSF Scorecard를 한 번에 모아 온다.
 *
 * 이 조회는 화면의 곁가지다. deps.dev가 죽어도 대시보드는 떠야 하므로 실패는 "모른다"로
 * 접어 두고, 몇 곳이 실패했는지만 한 줄 남긴다. 비공개 repository는 애초에 묻지 않는다.
 */
export async function loadScorecards(
  scorings: RepoScoring[],
): Promise<ScorecardIndex> {
  const keys = [
    ...new Set(scorings.filter((s) => !s.signals.isPrivate).map((s) => s.key)),
  ];

  let failures = 0;
  const entries = await mapInBatches(keys, BATCH_SIZE, async (key) => {
    try {
      const project = await fetchDepsDevProject(key);
      return [key, project?.scorecard?.overallScore ?? null] as const;
    } catch {
      failures++;
      return [key, null] as const;
    }
  });

  if (failures > 0) {
    console.error(
      `[patchwork] deps.dev 조회 ${failures}/${keys.length}건 실패 — 점수 없이 진행합니다.`,
    );
  }

  return new Map(entries);
}
