import type { Dictionary } from "@/shared/lib/i18n";

export const ko: Dictionary = {
  locale: "ko",
  numberLocale: "ko-KR",

  metadata: {
    title: "Patchwork",
    description: "GitHub 기여 내역과 진행 중인 PR 상태를 추적합니다.",
  },

  time: { locale: "ko-KR", justNow: "방금 전" },

  header: { signOut: "로그아웃", language: "언어" },

  home: {
    title: "오픈소스 기여를 한 장의 Patchwork로",
    subtitle: "GitHub contribution과 진행 중인 pull request 상태를 추적합니다.",
    setup: {
      step1:
        "GitHub → Settings → Developer settings → OAuth Apps 에서 앱을 만듭니다.",
      step2: {
        before: "Authorization callback URL 을 ",
        after: " 으로 지정합니다.",
      },
      step3: { before: "", middle: " 을 ", after: " 로 복사해 값을 채웁니다." },
    },
  },

  loginErrors: {
    not_configured: "GitHub OAuth 환경변수가 설정되지 않았습니다.",
    access_denied: "GitHub 로그인이 취소되었습니다.",
    invalid_state: "로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
    token_exchange_failed:
      "토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
    identity_failed: "GitHub 사용자 정보를 가져오지 못했습니다.",
    fallback: "로그인 중 문제가 발생했습니다.",
  },

  scope: { notable: "주요 OSS", all: "전체" },

  ranges: { "30d": "30일", "90d": "90일", "1y": "1년", "5y": "5년" },

  dashboard: {
    refresh: "새로고침",
    refreshing: "새로고침 중…",
    loading: "불러오는 중…",
    sessionExpired: {
      title: "세션이 만료되었습니다",
      body: "GitHub 토큰이 더 이상 유효하지 않습니다.",
      action: "다시 로그인",
    },
    loadFailed: { title: "데이터를 불러오지 못했습니다", action: "다시 시도" },
    unknownError: "알 수 없는 오류가 발생했습니다.",
    refreshFailed: "데이터를 새로 불러오지 못했습니다.",
    stats: {
      privateHint: "Private {count}건 포함",
      notable: "주요 OSS 기여",
      notableHint: "repository {count}곳",
      external: "외부 Repository 기여",
      externalHint: "전체의 {ratio}%",
      staleHint: "Stale {count}건",
      mergedHint: "Merged {count}건",
    },
    filteredAway: {
      repos:
        "기여한 repository {count}곳이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
      open: "열린 pull request {count}건이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
      merged:
        "merge된 pull request {count}건이 모두 주요 OSS가 아닙니다. 위에서 전체로 전환하면 볼 수 있습니다.",
    },
    repoTable: {
      empty: "이 기간에 기여한 repository가 없습니다.",
      unknownHint: "기여 수 상위 목록에서 잘려 정확한 수를 알 수 없습니다.",
      partialHint: "일부 항목을 알 수 없어 실제보다 적을 수 있습니다.",
      impactTitle: "권위 점수 {score}/100",
    },
    board: { empty: "열려 있는 pull request가 없습니다.", none: "없음" },
    merged: { empty: "이 기간에 merge된 pull request가 없습니다." },
  },

  export: {
    title: "README 내보내기",
    subtitle:
      "merge된 pull request와 완료 처리된 issue를 repository별로 묶어 Markdown으로 만듭니다.",
    summary: "repository {repos}곳 · {items}건",
    copy: "Markdown 복사",
    copied: "복사됨",
    empty:
      "이 기간에 merge된 pull request나 완료된 issue가 없습니다. 기간을 넓히거나 전체로 전환해 보세요.",
    retry: "다시 시도해 주세요.",
    loadFailed: "기여 목록을 불러오지 못했습니다.",
  },

  errors: {
    signInRequired: "로그인이 필요합니다.",
    dashboardFailed: "대시보드 데이터를 불러오지 못했습니다.",
    pullRequestsFailed: "PR을 불러오지 못했습니다.",
    contributionsWarning:
      "{total}개 구간 중 {failed}개를 불러오지 못해 일부 기간이 빠져 있습니다.",
  },

  github: {
    labels: {
      contributions: "기여 집계",
      contributionsPart: "기여 집계 {index}/{total}",
      pullRequests: "PR 조회",
      items: "기여 목록",
    },
    tokenInvalid: "GitHub 토큰이 만료되었거나 유효하지 않습니다.",
    requestFailed: "{label} 요청에 실패했습니다.",
    timeout:
      "{label} 요청이 {seconds}초 안에 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.",
    incomplete:
      "GitHub가 쿼리를 끝내지 못했습니다 (HTTP {status}). 기여한 Repository가 많으면 집계 쿼리가 제한 시간을 넘길 수 있습니다.",
    httpError: "GitHub API 오류 (HTTP {status}): {body}",
    emptyResponse: "GitHub 응답이 비어 있습니다.",
  },
};
