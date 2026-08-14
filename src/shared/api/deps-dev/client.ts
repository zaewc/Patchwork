import { DEPS_DEV_API_URL, DEPS_DEV_REVALIDATE_SECONDS } from "@/shared/config";

/**
 * deps.dev가 아는 프로젝트 정보. 우리가 쓰는 필드만 적는다.
 * @see https://docs.deps.dev/api/v3/
 */
export type DepsDevProject = {
  starsCount?: number;
  forksCount?: number;
  license?: string;
  /** OpenSSF Scorecard. 아직 평가되지 않은 프로젝트에는 없다. */
  scorecard?: {
    date: string;
    /** 0~10 */
    overallScore: number;
    checks: { name: string; score: number; reason: string }[];
  };
};

const TIMEOUT_MS = 5_000;

/** `owner/repo` → deps.dev 프로젝트 키 */
const projectKey = (nameWithOwner: string) =>
  encodeURIComponent(`github.com/${nameWithOwner}`);

/**
 * 프로젝트 하나를 조회한다. deps.dev가 모르는 repository는 null이다.
 *
 * 이 조회는 화면의 곁가지다. 실패하면 예외를 올리고, 부르는 쪽이 점수 없이 진행할지
 * 정한다. GitHub 조회와 달리 재시도하지 않는다 — 없는 데이터를 기다릴 이유가 없다.
 */
export async function fetchDepsDevProject(
  nameWithOwner: string,
): Promise<DepsDevProject | null> {
  const response = await fetch(`${DEPS_DEV_API_URL}/projects/${projectKey(nameWithOwner)}`, {
    headers: { Accept: "application/json", "User-Agent": "Patchwork" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: DEPS_DEV_REVALIDATE_SECONDS },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`deps.dev 조회 실패 (HTTP ${response.status}): ${nameWithOwner}`);
  }

  return (await response.json()) as DepsDevProject;
}
