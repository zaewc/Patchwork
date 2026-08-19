import type { Dictionary } from "@/shared/lib/i18n";

export const ja: Dictionary = {
  locale: "ja",
  numberLocale: "ja-JP",

  metadata: {
    title: "Patchwork",
    description:
      "GitHubのコントリビューションと進行中のプルリクエストを追跡します。",
  },

  time: { locale: "ja-JP", justNow: "たった今" },

  header: {
    signOut: "ログアウト",
    language: "言語",
    theme: "テーマ",
    themes: {
      system: "システム設定",
      light: "ライト",
      dark: "ダーク",
    },
  },

  home: {
    title: "オープンソースへの貢献を一枚のPatchworkに",
    subtitle:
      "GitHubのコントリビューションと、進行中のプルリクエストの状態を追跡します。",
    setup: {
      step1:
        "GitHub → Settings → Developer settings → OAuth Apps でアプリを作成します。",
      step2: {
        before: "Authorization callback URL を ",
        after: " に設定します。",
      },
      step3: {
        before: "",
        middle: " を ",
        after: " にコピーして値を入力します。",
      },
    },
  },

  loginErrors: {
    not_configured: "GitHub OAuth の環境変数が設定されていません。",
    access_denied: "GitHub へのログインがキャンセルされました。",
    invalid_state:
      "ログインリクエストの有効期限が切れました。もう一度お試しください。",
    token_exchange_failed:
      "トークンの交換に失敗しました。Client ID と Secret を確認してください。",
    identity_failed: "GitHub のユーザー情報を取得できませんでした。",
    fallback: "ログイン中に問題が発生しました。",
  },

  scope: { notable: "主要OSS", all: "すべて" },

  ranges: { "30d": "30日", "90d": "90日", "1y": "1年", "5y": "5年" },

  dashboard: {
    refresh: "更新",
    refreshing: "更新中…",
    loading: "読み込み中…",
    sessionExpired: {
      title: "セッションの有効期限が切れました",
      body: "GitHub トークンが有効ではなくなりました。",
      action: "再ログイン",
    },
    loadFailed: { title: "データを読み込めませんでした", action: "再試行" },
    unknownError: "不明なエラーが発生しました。",
    refreshFailed: "最新のデータを取得できませんでした。",
    stats: {
      privateHint: "Private {count}件を含む",
      notable: "主要OSSへの貢献",
      notableHint: "リポジトリ{count}件",
      external: "外部リポジトリへの貢献",
      externalHint: "全体の{ratio}%",
      staleHint: "Stale {count}件",
      mergedHint: "Merged {count}件",
    },
    filteredAway: {
      repos:
        "貢献したリポジトリ{count}件は、いずれも主要OSSではありません。上で「すべて」に切り替えると表示されます。",
      open: "オープンなプルリクエスト{count}件は、いずれも主要OSSではありません。上で「すべて」に切り替えると表示されます。",
      merged:
        "マージされたプルリクエスト{count}件は、いずれも主要OSSではありません。上で「すべて」に切り替えると表示されます。",
    },
    repoTable: {
      empty: "この期間に貢献したリポジトリはありません。",
      unknownHint: "貢献数の上位リストから外れたため、正確な数はわかりません。",
      partialHint:
        "一部の項目が不明なため、実際より少なく見えることがあります。",
      impactTitle: "権威スコア {score}/100",
    },
    board: { empty: "オープンなプルリクエストはありません。", none: "なし" },
    merged: { empty: "この期間にマージされたプルリクエストはありません。" },
  },

  export: {
    title: "README への書き出し",
    subtitle:
      "マージされたプルリクエストと完了した issue を、リポジトリごとにまとめて Markdown にします。",
    summary: "リポジトリ{repos}件 · {items}件",
    copy: "Markdown をコピー",
    copied: "コピーしました",
    empty:
      "この期間にマージされたプルリクエストも、完了した issue もありません。期間を広げるか「すべて」に切り替えてみてください。",
    retry: "もう一度お試しください。",
    loadFailed: "貢献リストを読み込めませんでした。",
  },

  errors: {
    signInRequired: "ログインが必要です。",
    badRequest: "リクエストの形式が正しくありません。",
    dashboardFailed: "ダッシュボードのデータを読み込めませんでした。",
    pullRequestsFailed: "プルリクエストを読み込めませんでした。",
    contributionsWarning:
      "{total}区間のうち{failed}区間を読み込めなかったため、一部の期間が欠けています。",
  },

  github: {
    labels: {
      contributions: "コントリビューション集計",
      contributionsPart: "コントリビューション集計 {index}/{total}",
      pullRequests: "プルリクエスト検索",
      items: "貢献リスト",
    },
    tokenInvalid: "GitHub トークンの有効期限が切れているか、無効です。",
    requestFailed: "{label} のリクエストに失敗しました。",
    timeout:
      "{label} のリクエストが{seconds}秒以内に終わりませんでした。しばらくしてからもう一度お試しください。",
    incomplete:
      "GitHub がクエリを完了できませんでした (HTTP {status})。貢献したリポジトリが多いと、集計クエリが制限時間を超えることがあります。",
    httpError: "GitHub API エラー (HTTP {status}): {body}",
    emptyResponse: "GitHub のレスポンスが空です。",
  },
};
