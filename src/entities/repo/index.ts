export { RepoLogo } from "@/entities/repo/ui/RepoLogo";

export {
  AUDIENCE_WEIGHTS,
  isNotable,
  NOTABLE_MIN,
  scoreRepo,
} from "@/entities/repo/model/impact";
export type { RepoSignals } from "@/entities/repo/model/impact";

export { audienceScore } from "@/entities/repo/model/audience";

export { repoScoringOf, repoSignalsOf } from "@/entities/repo/model/signals";

export { withImpact } from "@/entities/repo/model/scoring";
export type {
  RepoScoring,
  ScorecardIndex,
  Unscored,
} from "@/entities/repo/model/scoring";

export { loadScorecards } from "@/entities/repo/api/loadScorecards";

export { REPO_COUNT_FIELDS } from "@/entities/repo/model/types";
export type { RepoCountField, RepoStat } from "@/entities/repo/model/types";
