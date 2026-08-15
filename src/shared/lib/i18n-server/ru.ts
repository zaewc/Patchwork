import type { Dictionary } from "@/shared/lib/i18n";

/**
 * 러시아어에는 수에 따라 명사 어미가 갈리는 규칙이 있다(1 · 2~4 · 5 이상).
 * 사전은 문자열 한 벌뿐이라 어미를 골라 줄 수 없으므로, 수가 끼어드는 자리는
 * `Репозиториев: {count}`처럼 콜론이나 괄호로 떼어 놓았다. 러시아어 UI에서
 * 흔히 쓰는 방식이고, 어떤 수가 와도 문장이 어색해지지 않는다.
 */
export const ru: Dictionary = {
  locale: "ru",
  numberLocale: "ru-RU",

  metadata: {
    title: "Patchwork",
    description: "Отслеживает ваш вклад в GitHub и пул-реквесты в работе.",
  },

  time: { locale: "ru-RU", justNow: "только что" },

  header: { signOut: "Выйти", language: "Язык" },

  home: {
    title: "Ваш вклад в открытый код — одним полотном",
    subtitle:
      "Отслеживайте свой вклад в GitHub и состояние открытых пул-реквестов.",
    setup: {
      step1:
        "Создайте приложение в GitHub → Settings → Developer settings → OAuth Apps.",
      step2: {
        before: "Укажите Authorization callback URL как ",
        after: ".",
      },
      step3: {
        before: "Скопируйте ",
        middle: " в ",
        after: " и заполните значения.",
      },
    },
  },

  loginErrors: {
    not_configured: "Переменные окружения GitHub OAuth не заданы.",
    access_denied: "Вход через GitHub отменён.",
    invalid_state: "Срок запроса на вход истёк. Попробуйте ещё раз.",
    token_exchange_failed:
      "Не удалось обменять код на токен. Проверьте Client ID и Secret.",
    identity_failed: "Не удалось получить данные вашей учётной записи GitHub.",
    fallback: "При входе что-то пошло не так.",
  },

  scope: { notable: "Заметные OSS", all: "Все" },

  ranges: { "30d": "30 дней", "90d": "90 дней", "1y": "1 год", "5y": "5 лет" },

  dashboard: {
    refresh: "Обновить",
    refreshing: "Обновление…",
    loading: "Загрузка…",
    sessionExpired: {
      title: "Сессия истекла",
      body: "Токен GitHub больше недействителен.",
      action: "Войти снова",
    },
    loadFailed: { title: "Не удалось загрузить данные", action: "Повторить" },
    unknownError: "Произошла неизвестная ошибка.",
    refreshFailed: "Не удалось получить свежие данные.",
    stats: {
      privateHint: "Включая приватные: {count}",
      notable: "Вклад в заметные OSS",
      notableHint: "Репозиториев: {count}",
      external: "Вклад во внешние репозитории",
      externalHint: "{ratio}% от всех",
      staleHint: "Stale: {count}",
      mergedHint: "Merged: {count}",
    },
    filteredAway: {
      repos:
        "Ни один из репозиториев с вашим вкладом ({count}) не относится к заметным OSS. Переключитесь на «Все» выше, чтобы увидеть их.",
      open: "Ни один из ваших открытых пул-реквестов ({count}) не относится к заметным OSS. Переключитесь на «Все» выше, чтобы увидеть их.",
      merged:
        "Ни один из ваших влитых пул-реквестов ({count}) не относится к заметным OSS. Переключитесь на «Все» выше, чтобы увидеть их.",
    },
    repoTable: {
      empty: "За этот период нет репозиториев с вашим вкладом.",
      unknownHint:
        "Запись не попала в список самых активных, поэтому точное число неизвестно.",
      partialHint:
        "Часть значений неизвестна, поэтому итог может быть меньше реального.",
      impactTitle: "Оценка значимости {score}/100",
    },
    board: { empty: "Открытых пул-реквестов нет.", none: "Нет" },
    merged: { empty: "За этот период не влито ни одного пул-реквеста." },
  },

  export: {
    title: "Экспорт в README",
    subtitle:
      "Группирует ваши влитые пул-реквесты и завершённые issue по репозиториям в виде Markdown.",
    summary: "Репозиториев: {repos} · Записей: {items}",
    copy: "Копировать Markdown",
    copied: "Скопировано",
    empty:
      "За этот период нет ни влитых пул-реквестов, ни завершённых issue. Расширьте период или переключитесь на «Все».",
    retry: "Попробуйте ещё раз.",
    loadFailed: "Не удалось загрузить список вклада.",
  },

  errors: {
    signInRequired: "Требуется вход.",
    dashboardFailed: "Не удалось загрузить данные панели.",
    pullRequestsFailed: "Не удалось загрузить пул-реквесты.",
    contributionsWarning:
      "Не удалось загрузить {failed} из {total} интервалов, поэтому часть периода отсутствует.",
  },

  github: {
    labels: {
      contributions: "Сводка вклада",
      contributionsPart: "Сводка вклада {index}/{total}",
      pullRequests: "Поиск пул-реквестов",
      items: "Список вклада",
    },
    tokenInvalid: "Токен GitHub истёк или недействителен.",
    requestFailed: "Запрос «{label}» не удался.",
    timeout:
      "Запрос «{label}» не завершился за {seconds} с. Попробуйте ещё раз чуть позже.",
    incomplete:
      "GitHub не смог завершить запрос (HTTP {status}). Если репозиториев с вашим вкладом много, сводный запрос может превысить лимит времени.",
    httpError: "Ошибка GitHub API (HTTP {status}): {body}",
    emptyResponse: "GitHub вернул пустой ответ.",
  },
};
