import type { ContributionsCollection } from "@/entities/contribution/model/types";
import {
  MAX_REPOSITORIES,
  MAX_REPOSITORIES_SECONDARY,
  REPO_CORE_FRAGMENT,
  VIEWER_FIELDS,
  githubGraphQL,
  type GitHubMessages,
  type GitHubViewer,
} from "@/shared/api";

const REPO_FIELDS = `
  repository { ...RepoCore }
  contributions { totalCount }
`;

const CONTRIBUTIONS_QUERY = `
${REPO_CORE_FRAGMENT}

query Contributions($from: DateTime!, $to: DateTime!) {
  viewer {
    ${VIEWER_FIELDS}
    contributionsCollection(from: $from, to: $to) {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
      commitContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES}) { ${REPO_FIELDS} }
      pullRequestContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
      pullRequestReviewContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
      issueContributionsByRepository(maxRepositories: ${MAX_REPOSITORIES_SECONDARY}) { ${REPO_FIELDS} }
    }
  }
}`;

type ContributionsQuery = {
  viewer: GitHubViewer & { contributionsCollection: ContributionsCollection };
};

export type ContributionsSnapshot = {
  viewer: GitHubViewer;
  collection: ContributionsCollection;
};

/** 조회 창 하나만큼의 기여를 가져온다. GitHub은 한 번에 1년까지만 돌려준다. */
export async function fetchContributions(
  token: string,
  window: { from: Date; to: Date },
  messages: GitHubMessages,
  label: string,
): Promise<ContributionsSnapshot> {
  const data = await githubGraphQL<ContributionsQuery>(
    token,
    CONTRIBUTIONS_QUERY,
    { from: window.from.toISOString(), to: window.to.toISOString() },
    messages,
    label,
  );

  const { contributionsCollection, ...viewer } = data.viewer;
  return { viewer, collection: contributionsCollection };
}
