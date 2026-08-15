import { GITHUB_GRAPHQL_URL } from "@/shared/config";
import { GitHubAuthError, GitHubError } from "@/shared/api/github/errors";
import { interpolate, type Dictionary } from "@/shared/lib/i18n";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; type?: string }[];
};

/**
 * 실패를 알릴 문구. 이 모듈은 요청에서 언어를 직접 읽지 않고 받아 쓴다.
 * `next/headers`를 들이면 이 파일을 스치는 배럴을 통해 브라우저 번들까지 딸려 간다.
 */
export type GitHubMessages = Dictionary["github"];

/** GitHub는 쿼리가 제한 시간을 넘기면 JSON 대신 프록시의 502/504 HTML을 돌려준다. */
const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const ATTEMPTS = 3;
const TIMEOUT_MS = 20_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GitHub GraphQL 한 번 호출. 일시적인 실패(타임아웃·5xx·TIMEOUT 오류)는 지수 백오프로
 * 세 번까지 다시 시도하고, 인증 실패는 즉시 GitHubAuthError로 올린다.
 *
 * label은 실패 메시지와 로그에 그대로 들어간다. "기여 집계 2/5"처럼 어느 요청이
 * 무너졌는지 사용자와 로그가 함께 알 수 있게 부르는 쪽에서 정해 준다.
 *
 * 실패 문구는 부르는 쪽이 요청의 언어로 넣어 준다. 여기서 만든 메시지가 그대로
 * 화면에 오르기 때문이다. GitHub이 준 사유(json.errors)는 그쪽 말 그대로 전한다.
 */
export async function githubGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  messages: GitHubMessages,
  label = "GitHub",
): Promise<T> {
  let lastError = new GitHubError(
    interpolate(messages.requestFailed, { label }),
  );

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) await wait(400 * 2 ** (attempt - 1));

    let res: Response;
    try {
      res = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Patchwork",
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      lastError = new GitHubError(
        interpolate(messages.timeout, { label, seconds: TIMEOUT_MS / 1000 }),
      );
      continue;
    }

    if (res.status === 401) throw new GitHubAuthError(messages.tokenInvalid);

    if (RETRYABLE_STATUS.has(res.status)) {
      console.error(
        `[patchwork] ${label} 쿼리 HTTP ${res.status} (시도 ${attempt}/${ATTEMPTS})`,
        `x-github-request-id=${res.headers.get("x-github-request-id") ?? "none"}`,
      );
      lastError = new GitHubError(
        interpolate(messages.incomplete, { status: res.status }),
      );
      continue;
    }

    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      throw new GitHubError(
        interpolate(messages.httpError, { status: res.status, body }),
      );
    }

    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) {
      if (
        json.errors.some(
          (e) => e.type === "FORBIDDEN" || /bad credentials/i.test(e.message),
        )
      ) {
        throw new GitHubAuthError(messages.tokenInvalid);
      }
      // TIMEOUT/서버측 일시 오류는 재시도할 가치가 있다.
      if (
        json.errors.some(
          (e) => e.type === "TIMEOUT" || e.type === "SERVICE_UNAVAILABLE",
        )
      ) {
        lastError = new GitHubError(
          json.errors.map((e) => e.message).join("; "),
        );
        continue;
      }
      throw new GitHubError(json.errors.map((e) => e.message).join("; "));
    }
    if (!json.data) throw new GitHubError(messages.emptyResponse);
    return json.data;
  }

  throw lastError;
}
