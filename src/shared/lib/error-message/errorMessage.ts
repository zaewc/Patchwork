/**
 * 잡은 값에서 사용자에게 보여줄 문구를 꺼낸다.
 * catch로 들어오는 값은 무엇이든 될 수 있으므로 Error가 아니면 준비된 문구를 쓴다.
 */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
