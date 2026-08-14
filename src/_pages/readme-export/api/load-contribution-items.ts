import { fetchContributionItems, type ContributionGroup } from "@/entities/contribution";
import { loadScorecards, withImpact } from "@/entities/repo";
import { rangeStartDate, type RangeKey } from "@/shared/config";

/**
 * 화면이 고른 조회 범위를 GitHub 검색 한정자의 날짜로 바꿔 기여 목록을 가져오고,
 * repository마다 OpenSSF Scorecard 점수를 붙인다.
 * 현재 시각을 읽는 일은 렌더 바깥인 여기서 한다.
 */
export async function loadContributionItems(
  token: string,
  range: RangeKey,
): Promise<ContributionGroup[]> {
  const groups = await fetchContributionItems(token, rangeStartDate(range, Date.now()));
  const scorecards = await loadScorecards(groups.map((group) => group.scoring));

  return groups.map((group) => withImpact<ContributionGroup>(group, scorecards));
}
