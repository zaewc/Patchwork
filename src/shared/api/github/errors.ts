/** 토큰이 더 이상 쓸 수 없는 상태. 화면은 다시 로그인을 안내해야 한다. */
export class GitHubAuthError extends Error {
  constructor(message = "GitHub 토큰이 만료되었거나 유효하지 않습니다.") {
    super(message);
    this.name = "GitHubAuthError";
  }
}

/** 그 밖의 GitHub 쪽 실패. 사용자에게 사유를 그대로 보여줄 수 있다. */
export class GitHubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubError";
  }
}
