import type { RepoRef } from "@/shared/api";

/** 기여 달력의 하루 */
export type CalendarDay = { date: string; count: number; weekday: number };

/** contributionsCollection의 *ByRepository 한 항목 */
export type ContributionsByRepository = {
  repository: RepoRef;
  contributions: { totalCount: number };
}[];

/** 조회 창 하나에 대한 기여 집계 원본 */
export type ContributionsCollection = {
  restrictedContributionsCount: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: {
      contributionDays: { date: string; contributionCount: number; weekday: number }[];
    }[];
  };
  commitContributionsByRepository: ContributionsByRepository;
  pullRequestContributionsByRepository: ContributionsByRepository;
  pullRequestReviewContributionsByRepository: ContributionsByRepository;
  issueContributionsByRepository: ContributionsByRepository;
};

/** README에 붙일 만한, 결론이 난 기여 하나 */
export type ContributionItem = {
  type: "PR" | "Issue";
  title: string;
  url: string;
  createdAt: string;
};

/** 한 repository에 쌓인 기여 묶음 */
export type ContributionGroup = {
  name: string;
  nameWithOwner: string;
  url: string;
  impact: number;
  items: ContributionItem[];
};
