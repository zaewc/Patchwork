/** 로그인한 사용자를 가리키는 GraphQL `viewer`의 공통 필드 */

export const VIEWER_FIELDS = `login name avatarUrl(size: 96)`;

export type GitHubViewer = {
  login: string;
  name: string | null;
  avatarUrl: string;
};
