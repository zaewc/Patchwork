import type { Dictionary } from "@/shared/lib/i18n";

export const en: Dictionary = {
  locale: "en",
  numberLocale: "en-US",

  metadata: {
    title: "Patchwork",
    description:
      "Track your GitHub contributions and the pull requests still in flight.",
  },

  time: { locale: "en-US", justNow: "just now" },

  header: { signOut: "Sign out", language: "Language" },

  home: {
    title: "Your open source work, as one Patchwork",
    subtitle:
      "Track your GitHub contributions and the state of your open pull requests.",
    setup: {
      step1:
        "Create an app under GitHub → Settings → Developer settings → OAuth Apps.",
      step2: { before: "Set the Authorization callback URL to ", after: "." },
      step3: {
        before: "Copy ",
        middle: " to ",
        after: " and fill in the values.",
      },
    },
  },

  loginErrors: {
    not_configured: "The GitHub OAuth environment variables are not set.",
    access_denied: "The GitHub sign-in was cancelled.",
    invalid_state: "The sign-in request expired. Please try again.",
    token_exchange_failed:
      "The token exchange failed. Check your Client ID and Secret.",
    identity_failed: "Could not read your GitHub account details.",
    fallback: "Something went wrong while signing in.",
  },

  scope: { notable: "Notable OSS", all: "All" },

  ranges: {
    "30d": "30 days",
    "90d": "90 days",
    "1y": "1 year",
    "5y": "5 years",
  },

  dashboard: {
    refresh: "Refresh",
    refreshing: "Refreshing…",
    loading: "Loading…",
    sessionExpired: {
      title: "Your session has expired",
      body: "The GitHub token is no longer valid.",
      action: "Sign in again",
    },
    loadFailed: { title: "Could not load the data", action: "Try again" },
    unknownError: "An unknown error occurred.",
    refreshFailed: "Could not fetch the latest data.",
    stats: {
      privateHint: "Includes {count} private",
      notable: "Notable OSS contributions",
      notableHint: "{count} repositories",
      external: "External repository contributions",
      externalHint: "{ratio}% of all",
      staleHint: "{count} stale",
      mergedHint: "{count} merged",
    },
    filteredAway: {
      repos:
        "None of the {count} repositories you contributed to count as notable OSS. Switch to All above to see them.",
      open: "None of your {count} open pull requests are on notable OSS. Switch to All above to see them.",
      merged:
        "None of your {count} merged pull requests are on notable OSS. Switch to All above to see them.",
    },
    repoTable: {
      empty: "No repositories were contributed to in this period.",
      unknownHint:
        "Trimmed from the top-contributions list, so the exact count is unknown.",
      partialHint:
        "Some entries are unknown, so this may be lower than the real total.",
      impactTitle: "Authority score {score}/100",
    },
    board: { empty: "No open pull requests.", none: "None" },
    merged: { empty: "No pull requests were merged in this period." },
  },

  export: {
    title: "Export to README",
    subtitle:
      "Groups your merged pull requests and completed issues by repository as Markdown.",
    summary: "{repos} repositories · {items} items",
    copy: "Copy Markdown",
    copied: "Copied",
    empty:
      "No pull requests were merged and no issues were completed in this period. Widen the range or switch to All.",
    retry: "Please try again.",
    loadFailed: "Could not load your contributions.",
  },

  errors: {
    signInRequired: "Sign-in required.",
    dashboardFailed: "Could not load the dashboard data.",
    pullRequestsFailed: "Could not load pull requests.",
    contributionsWarning:
      "{failed} of {total} windows could not be loaded, so part of the period is missing.",
  },

  github: {
    labels: {
      contributions: "Contribution totals",
      contributionsPart: "Contribution totals {index}/{total}",
      pullRequests: "Pull request search",
      items: "Contribution list",
    },
    tokenInvalid: "The GitHub token has expired or is invalid.",
    requestFailed: "The {label} request failed.",
    timeout:
      "The {label} request did not finish within {seconds}s. Please try again shortly.",
    incomplete:
      "GitHub could not finish the query (HTTP {status}). If you contribute to many repositories, the aggregate query can exceed the time limit.",
    httpError: "GitHub API error (HTTP {status}): {body}",
    emptyResponse: "The GitHub response was empty.",
  },
};
