import { repoScoringOf, type Unscored } from "@/entities/repo/@x/contribution";
import type { ContributionGroup } from "@/entities/contribution/model/types";
import {
  MAX_SEARCH_PAGES,
  REPO_CORE_FRAGMENT,
  githubGraphQL,
  type RepoRef,
} from "@/shared/api";

const ITEMS_QUERY = `
${REPO_CORE_FRAGMENT}

fragment Item on Node {
  ... on PullRequest { title url createdAt mergedAt repository { ...RepoCore } }
  ... on Issue { title url createdAt stateReason repository { ...RepoCore } }
}

query Items($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { __typename ...Item }
  }
}`;

type ItemNode = {
  __typename: "PullRequest" | "Issue" | string;
  title: string;
  url: string;
  createdAt: string;
  mergedAt?: string | null;
  stateReason?: "COMPLETED" | "NOT_PLANNED" | "REOPENED" | "DUPLICATE" | null;
  repository: RepoRef;
};

/** search는 Item 조각이 채워지지 않은 노드도 섞어 돌려준다. */
type SearchNode = ItemNode | Record<string, never>;

type ItemsQuery = {
  search: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: SearchNode[];
  };
};

function isItemNode(node: SearchNode): node is ItemNode {
  return "repository" in node && Boolean(node.repository);
}

/** 결론이 난 기여만 남긴다: merge된 PR과, 메인테이너가 완료로 닫은 issue. */
function isConcluded(node: ItemNode): boolean {
  return node.__typename === "PullRequest"
    ? Boolean(node.mergedAt)
    : node.stateReason === "COMPLETED";
}

async function searchAllPages(token: string, query: string): Promise<ItemNode[]> {
  const nodes: ItemNode[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
    const data: ItemsQuery = await githubGraphQL<ItemsQuery>(
      token,
      ITEMS_QUERY,
      { q: query, after },
      "기여 목록",
    );
    nodes.push(...data.search.nodes.filter(isItemNode));

    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  }

  return nodes;
}

/**
 * 기간 안의 "결론이 난" 기여만 repository별로 묶는다.
 *  - PR: merge된 것만. 열려 있거나 반려된 것은 제외.
 *  - Issue: 메인테이너가 완료로 닫은 것만. not planned로 닫힌 제보는 제외.
 * 공개 저장소만 담는다 — README에 붙일 링크라 비공개는 의미가 없다.
 */
export async function fetchContributionItems(
  token: string,
  since: string,
): Promise<Unscored<ContributionGroup>[]> {
  const scope = `author:@me is:public created:>=${since} sort:created-asc`;

  const [pullRequests, issues] = await Promise.all([
    searchAllPages(token, `${scope} is:pr is:merged`),
    searchAllPages(token, `${scope} is:issue is:closed reason:completed`),
  ]);

  const groups = new Map<string, Unscored<ContributionGroup>>();

  for (const node of [...pullRequests, ...issues]) {
    // 검색 한정자를 GitHub이 무시하는 경우까지 대비해 응답 값으로 한 번 더 거른다.
    if (!isConcluded(node)) continue;

    const repo = node.repository;
    let group = groups.get(repo.nameWithOwner);
    if (!group) {
      group = {
        name: repo.name,
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        scoring: repoScoringOf(repo),
        items: [],
      };
      groups.set(repo.nameWithOwner, group);
    }
    group.items.push({
      type: node.__typename === "PullRequest" ? "PR" : "Issue",
      title: node.title,
      url: node.url,
      createdAt: node.createdAt,
    });
  }

  // 기여가 많은 repository부터. 목록 안은 시간순.
  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}
