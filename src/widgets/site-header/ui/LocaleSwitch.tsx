import ReactCountryFlag from "react-country-flag";
import { LOCALE_LABELS, LOCALES, ROUTES, type Locale } from "@/shared/config";
import { ChevronDownIcon } from "@/shared/ui/icon";

/**
 * 국기 한 장.
 *
 * `svg`를 켜야 이모지 대신 진짜 그림을 받는다. 이모지 국기는 Windows에 글꼴이 없어
 * `KR`·`US` 같은 글자 두 개로 떨어진다. 그림은 jsdelivr의 flag-icons에서 온다 —
 * 바깥 요청이 싫으면 `public/flags/`에 받아 두고 `cdnUrl`만 바꾸면 된다.
 *
 * 4:3 비율이라 높이는 `auto`로 둔다. 패키지 기본값은 1em 정사각형이라 눌린다.
 * 뜻은 옆의 이름이 이미 말하므로 스크린 리더에는 감춘다.
 */
const Flag = ({ countryCode }: { countryCode: string }) => (
  <ReactCountryFlag
    svg
    countryCode={countryCode}
    alt=""
    aria-hidden
    style={{ width: "1.15em", height: "auto" }}
  />
);

/**
 * 보는 언어를 바꾸는 자리.
 *
 * 주소는 그대로 두고 쿠키만 갈아끼우므로 폼 전송 하나면 된다. 라우트 핸들러가 보내 온
 * 곳으로 되돌려 보내므로 조회 조건도 그대로 남는다.
 *
 * 펼치는 일은 `<details>`가 한다. 자바스크립트 없이 열리고 닫히며, 고르는 순간 폼이
 * 전송되고 화면이 새로 오면서 저절로 닫힌다 — 언어를 바꾸겠다고 머리 전체를
 * 클라이언트 컴포넌트로 만들 이유가 없다.
 *
 * 아는 언어를 모두 늘어놓으므로 언어를 늘려도 이 파일은 손대지 않는다.
 */
export function LocaleSwitch({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const current = LOCALE_LABELS[locale];

  return (
    <form action={ROUTES.locale} method="post" aria-label={label}>
      <details className="group relative">
        {/* 보이는 글자는 언어 이름뿐이라 무엇을 여는 단추인지 이름으로 마저 알린다. */}
        <summary
          aria-label={`${label}: ${current.name}`}
          className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden"
        >
          <Flag countryCode={current.countryCode} />
          {current.name}
          <ChevronDownIcon
            size={12}
            className="transition-transform group-open:rotate-180"
          />
        </summary>

        <ul className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-md border border-border bg-surface py-1 text-xs shadow-lg">
          {LOCALES.map((value) => {
            const option = LOCALE_LABELS[value];
            const selected = value === locale;

            return (
              <li key={value}>
                <button
                  type="submit"
                  name="locale"
                  value={value}
                  aria-current={selected ? "true" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left transition-colors ${
                    selected
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <Flag countryCode={option.countryCode} />
                  {option.name}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </form>
  );
}
