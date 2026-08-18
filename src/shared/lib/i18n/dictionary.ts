import type { Locale, RangeKey } from "@/shared/config";

/**
 * 화면에 나오는 문구 중 **언어마다 달라지는 것**만 담는다.
 *
 * `Contributions`·`Repositories`·`Less`/`More`·`Mon`/`Wed`/`Fri`처럼 원래부터 영어인
 * 골격 라벨은 두 언어에서 같은 값이라 사전에 넣지 않고 컴포넌트에 그대로 둔다.
 *
 * 모든 값은 문자열이다. 서버 컴포넌트가 클라이언트 컴포넌트로 그대로 넘기려면
 * 직렬화할 수 있어야 하므로 함수를 넣지 않는다. 값이 끼어드는 자리는 `{이름}`으로
 * 비워 두고 `interpolate`가 채운다.
 */
export type Dictionary = {
  /** 이 묶음이 어느 언어인지. `<html lang>`과 언어 전환 UI가 그대로 쓴다. */
  locale: Locale;
  /** 숫자에 자릿점을 찍을 때 쓰는 BCP 47 태그 */
  numberLocale: string;

  metadata: { title: string; description: string };

  time: {
    /** Intl.RelativeTimeFormat에 넘길 BCP 47 태그 */
    locale: string;
    justNow: string;
  };

  header: { signOut: string; language: string };

  home: {
    title: string;
    subtitle: string;
    /** OAuth 앱이 아직 없을 때의 준비 절차. 사이사이에 코드 조각이 끼어든다. */
    setup: {
      step1: string;
      step2: { before: string; after: string };
      step3: { before: string; middle: string; after: string };
    };
  };

  /** 라우트 핸들러가 `?error=<key>`로 돌려보낸 사유 */
  loginErrors: {
    not_configured: string;
    access_denied: string;
    invalid_state: string;
    token_exchange_failed: string;
    identity_failed: string;
    fallback: string;
  };

  scope: { notable: string; all: string };
  ranges: Record<RangeKey, string>;

  dashboard: {
    refresh: string;
    refreshing: string;
    loading: string;
    sessionExpired: { title: string; body: string; action: string };
    loadFailed: { title: string; action: string };
    unknownError: string;
    refreshFailed: string;
    stats: {
      privateHint: string;
      notable: string;
      notableHint: string;
      external: string;
      externalHint: string;
      staleHint: string;
      mergedHint: string;
    };
    /** 걸러내기 때문에 목록이 통째로 빈 경우의 안내 */
    filteredAway: { repos: string; open: string; merged: string };
    repoTable: {
      empty: string;
      unknownHint: string;
      partialHint: string;
      impactTitle: string;
    };
    board: { empty: string; none: string };
    merged: { empty: string };
  };

  export: {
    title: string;
    subtitle: string;
    summary: string;
    copy: string;
    copied: string;
    empty: string;
    retry: string;
    loadFailed: string;
  };

  /** 라우트 핸들러가 JSON으로 돌려주는 사유와, 화면이 준비해 두는 대비 문구 */
  errors: {
    signInRequired: string;
    /** 라우트 핸들러가 알아들을 수 없는 요청을 받았을 때 */
    badRequest: string;
    dashboardFailed: string;
    pullRequestsFailed: string;
    contributionsWarning: string;
  };

  /**
   * GitHub 쪽 실패. `labels`는 어느 요청이 무너졌는지 알리려고 호출하는 쪽이 붙이는
   * 이름이고, 나머지는 GraphQL 클라이언트가 직접 만드는 문구다.
   */
  github: {
    labels: {
      contributions: string;
      contributionsPart: string;
      pullRequests: string;
      items: string;
    };
    tokenInvalid: string;
    requestFailed: string;
    timeout: string;
    incomplete: string;
    httpError: string;
    emptyResponse: string;
  };
};

export type Dictionaries = Record<Locale, Dictionary>;
