import { repoScoringOf, type Unscored } from "@/entities/repo/@x/pull-request";
import type {
  CheckState,
  PullRequest,
  ReviewDecision,
} from "@/entities/pull-request/model/types";
import { REPO_CORE_FRAGMENT, githubGraphQL, type RepoRef } from "@/shared/api";
import { daysSince } from "@/shared/lib/format";

const PULL_REQUESTS_QUERY = `
${REPO_CORE_FRAGMENT}

fragment PR on PullRequest {
  number
  title
  url
  isDraft
  updatedAt
  mergedAt
  reviewDecision
  repository { ...RepoCore }
  commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
}

query PullRequests($openQuery: String!, $mergedQuery: String!) {
  open: search(query: $openQuery, type: ISSUE, first: 30) {
    issueCount
    nodes { ...PR }
  }
  merged: search(query: $mergedQuery, type: ISSUE, first: 15) {
    issueCount
    nodes { ...PR }
  }
}`;

type PullRequestNode = {
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  mergedAt: string | null;
  reviewDecision: ReviewDecision;
  repository: RepoRef;
  commits: {
    nodes: { commit: { statusCheckRollup: { state: CheckState } | null } }[];
  };
};

/** search는 PR·Issue를 섞어 돌려주므로 PR 조각이 채워지지 않은 노드가 섞여 온다. */
type SearchNode = PullRequestNode | Record<string, never>;

type PullRequestsQuery = {
  open: { issueCount: number; nodes: SearchNode[] };
  merged: { issueCount: number; nodes: SearchNode[] };
};

const STALE_DAYS = 14;

function isPullRequestNode(node: SearchNode): node is PullRequestNode {
  return typeof (node as PullRequestNode).number === "number";
}

function toPullRequest(
  node: PullRequestNode,
  now: number,
): Unscored<PullRequest> {
  return {
    number: node.number,
    title: node.title,
    url: node.url,
    isDraft: node.isDraft,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt,
    reviewDecision: node.reviewDecision,
    checkState: node.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null,
    repo: node.repository.nameWithOwner,
    ownerAvatarUrl: node.repository.owner.avatarUrl,
    isPrivate: node.repository.isPrivate,
    scoring: repoScoringOf(node.repository),
    isStale: !node.mergedAt && daysSince(node.updatedAt, now) >= STALE_DAYS,
  };
}

export type PullRequestBoardData = {
  open: Unscored<PullRequest>[];
  merged: Unscored<PullRequest>[];
  /** GitHub이 센 열린 PR 전체 수. 화면에 담은 30건보다 클 수 있다. */
  openCount: number;
};

export const EMPTY_PULL_REQUESTS: PullRequestBoardData = {
  open: [],
  merged: [],
  openCount: 0,
};

/** 내가 낸 PR 중 열려 있는 것과, 주어진 날짜 이후 merge된 것을 함께 가져온다. */
export async function fetchPullRequests(
  token: string,
  mergedSince: string,
  now: number,
): Promise<PullRequestBoardData> {
  const data = await githubGraphQL<PullRequestsQuery>(
    token,
    PULL_REQUESTS_QUERY,
    {
      openQuery: "is:pr author:@me is:open archived:false sort:updated-desc",
      mergedQuery: `is:pr author:@me is:merged merged:>=${mergedSince} sort:updated-desc`,
    },
    "PR 조회",
  );

  const toList = (nodes: SearchNode[]) =>
    nodes.filter(isPullRequestNode).map((node) => toPullRequest(node, now));

  return {
    open: toList(data.open.nodes),
    merged: toList(data.merged.nodes),
    openCount: data.open.issueCount,
  };
}
