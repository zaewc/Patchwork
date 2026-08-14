/** GitHub이 한 번에 돌려주는 양의 상한. 쿼리를 짜는 곳과 "잘렸는지" 보는 곳이 같은 값을 봐야 한다. */

/**
 * contributionsCollection의 *ByRepository는 기여 수 상위 N곳만 돌려준다(GitHub 최대 100).
 * 이 상한에 걸려 잘리면 "커밋이 적은 repository"의 커밋 수가 통째로 빠져 0으로 집계된다.
 */
export const MAX_REPOSITORIES = 100;

/**
 * PR·review·issue는 커밋만큼 저장소가 많지 않다. 100으로 두면 창 5개 × 4항목에서
 * 같은 repository 정보가 최대 20번 반복돼 응답이 수백 KiB로 불어나고 502 위험이 커진다.
 */
export const MAX_REPOSITORIES_SECONDARY = 50;

/** search는 페이지당 100건, 전체 1000건이 상한이다. */
export const MAX_SEARCH_PAGES = 5;
