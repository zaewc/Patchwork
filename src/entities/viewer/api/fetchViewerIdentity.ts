import {
  VIEWER_FIELDS,
  githubGraphQL,
  type GitHubMessages,
  type GitHubViewer,
} from "@/shared/api";

/** 토큰이 누구의 것인지 확인한다. 로그인 직후 세션에 담을 정보를 얻는 용도다. */
export async function fetchViewerIdentity(
  token: string,
  messages: GitHubMessages,
): Promise<GitHubViewer> {
  const data = await githubGraphQL<{ viewer: GitHubViewer }>(
    token,
    `query { viewer { ${VIEWER_FIELDS} } }`,
    {},
    messages,
  );
  return data.viewer;
}
