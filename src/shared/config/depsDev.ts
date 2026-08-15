/**
 * deps.dev(Open Source Insights) API 주소. 인증이 필요 없는 공개 API다.
 * E2E 테스트가 mock 서버를 물리는 통로다.
 */
export const DEPS_DEV_API_URL =
  process.env.DEPS_DEV_API_URL ?? "https://api.deps.dev/v3";

/**
 * deps.dev가 스스로 붙이는 캐시 수명(`cache-control: max-age=3600`)에 맞춘다.
 * Scorecard는 하루 단위로 갱신되므로 매 요청마다 새로 물을 이유가 없다.
 * E2E는 시나리오를 바꿔 가며 확인해야 하므로 0(캐시 안 함)으로 낮춘다.
 */
export const DEPS_DEV_REVALIDATE_SECONDS = Number(
  process.env.DEPS_DEV_REVALIDATE_SECONDS ?? 3600,
);
