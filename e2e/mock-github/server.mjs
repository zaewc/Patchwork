/**
 * E2E용 GitHub 대역. OAuth 인가·토큰 교환과 GraphQL을 흉내낸다.
 *
 * 서버 쪽 fetch는 브라우저를 거치지 않으므로 Playwright의 요청 가로채기로는 잡을 수 없다.
 * 그래서 앱의 GITHUB_* 주소를 이 서버로 돌려 두고, 시나리오는 /__scenario 로 갈아끼운다.
 */

import { createServer } from "node:http";
import {
  COMPLETED_ITEMS,
  MERGED_ITEMS,
  MERGED_PULL_REQUESTS,
  OPEN_PULL_REQUESTS,
  VIEWER,
  contributionsCollection,
  emptyCollection,
} from "./data.mjs";

const PORT = Number(process.env.MOCK_GITHUB_PORT ?? 4010);

/** 현재 시나리오. 테스트가 매번 새로 정한다. */
let scenario = "default";

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(payload);
};

const graphQLErrors = (res, messages, type) =>
  send(res, 200, { errors: messages.map((message) => ({ message, type })) });

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });

const operationOf = (query) =>
  query.includes("query Contributions")
    ? "contributions"
    : query.includes("query PullRequests")
      ? "pullRequests"
      : query.includes("query Items")
        ? "items"
        : "viewer";

/* ------------------------------------------------------------------ GraphQL */

function handleGraphQL(res, { query, variables }) {
  const operation = operationOf(query);

  if (operation === "viewer") {
    if (scenario === "identity-failure") return send(res, 401, { message: "Bad credentials" });
    return send(res, 200, { data: { viewer: VIEWER } });
  }

  if (scenario === "token-expired") return send(res, 401, { message: "Bad credentials" });

  if (operation === "contributions") {
    if (scenario === "contributions-failure") {
      return graphQLErrors(res, ["기여한 Repository가 많아 집계 쿼리가 제한 시간을 넘겼습니다."]);
    }
    const collection = scenario === "empty" ? emptyCollection() : contributionsCollection();
    return send(res, 200, { data: { viewer: { ...VIEWER, contributionsCollection: collection } } });
  }

  if (operation === "pullRequests") {
    if (scenario === "pull-requests-failure") {
      return graphQLErrors(res, ["PR 검색이 실패했습니다."]);
    }
    const open = scenario === "empty" ? [] : OPEN_PULL_REQUESTS;
    const merged = scenario === "empty" ? [] : MERGED_PULL_REQUESTS;
    return send(res, 200, {
      data: {
        open: { issueCount: open.length, nodes: open },
        merged: { issueCount: merged.length, nodes: merged },
      },
    });
  }

  // items — README 내보내기
  if (scenario === "items-failure") {
    return graphQLErrors(res, ["기여 목록을 불러오지 못했습니다."]);
  }
  const isPullRequestSearch = String(variables.q).includes("is:pr");
  const nodes =
    scenario === "empty" ? [] : isPullRequestSearch ? MERGED_ITEMS : COMPLETED_ITEMS;
  return send(res, 200, {
    data: { search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes } },
  });
}

/* ------------------------------------------------------------------ OAuth */

function handleAuthorize(res, url) {
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const back = new URL(redirectUri);

  if (scenario === "oauth-denied") {
    back.searchParams.set("error", "access_denied");
  } else if (scenario === "oauth-state-mismatch") {
    back.searchParams.set("code", "test-code");
    back.searchParams.set("state", "다른-상태-값");
  } else {
    back.searchParams.set("code", "test-code");
    back.searchParams.set("state", state ?? "");
  }

  res.writeHead(302, { location: back.toString() });
  res.end();
}

function handleToken(res) {
  if (scenario === "token-http-failure") return send(res, 500, "internal error");
  if (scenario === "token-rejected") return send(res, 200, { error: "bad_verification_code" });
  return send(res, 200, { access_token: "gho_e2e_token", token_type: "bearer" });
}

/* ------------------------------------------------------------------ 라우팅 */

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/__scenario") {
    if (req.method === "POST") {
      scenario = JSON.parse((await readBody(req)) || "{}").scenario ?? "default";
      return send(res, 200, { scenario });
    }
    return send(res, 200, { scenario });
  }

  if (url.pathname === "/login/oauth/authorize") return handleAuthorize(res, url);
  if (url.pathname === "/login/oauth/access_token") return handleToken(res);

  if (url.pathname === "/graphql") {
    return handleGraphQL(res, JSON.parse((await readBody(req)) || "{}"));
  }

  send(res, 404, { message: `알 수 없는 경로: ${url.pathname}` });
});

server.listen(PORT, () => {
  console.log(`[mock-github] http://localhost:${PORT}`);
});
