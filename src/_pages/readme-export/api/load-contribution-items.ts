import { fetchContributionItems, type ContributionGroup } from "@/entities/contribution";
import { rangeStartDate, type RangeKey } from "@/shared/config";

/**
 * 화면이 고른 조회 범위를 GitHub 검색 한정자의 날짜로 바꿔 기여 목록을 가져온다.
 * 현재 시각을 읽는 일은 렌더 바깥인 여기서 한다.
 */
export function loadContributionItems(
  token: string,
  range: RangeKey,
): Promise<ContributionGroup[]> {
  return fetchContributionItems(token, rangeStartDate(range, Date.now()));
}
