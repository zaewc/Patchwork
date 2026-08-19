import { ROUTES, THEMES, type Theme } from "@/shared/config";
import type { Dictionary } from "@/shared/lib/i18n";
import {
  ChevronDownIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "@/shared/ui/icon";

/** 테마마다 붙는 그림. 뜻은 옆의 이름이 지고, 이것은 눈에 띄라고 있는 것이다. */
const THEME_ICONS: Record<Theme, typeof SunIcon> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

/**
 * 보는 색을 바꾸는 자리.
 *
 * 언어 전환과 같은 방식이다 — 주소는 그대로 두고 쿠키만 갈아끼우므로 폼 전송 하나면 되고,
 * 펼치는 일은 `<details>`가 자바스크립트 없이 한다. 색을 바꾸겠다고 머리 전체를 클라이언트
 * 컴포넌트로 만들 이유가 없다.
 *
 * **깜빡임이 없는 것이 이 방식의 핵심이다.** 쿠키를 서버가 읽어 `<html data-theme>`에 적어
 * 보내므로 첫 그림부터 고른 색이다. 브라우저에서 색을 고치는 흔한 방법(스크립트가 켜진 뒤
 * class를 붙이는 것)은 그 사이에 반대 색이 한 번 번쩍인다.
 *
 * `system`은 "고르지 않았다"는 뜻이라 서버는 아무것도 적지 않고 CSS가 운영체제를 따른다.
 */
export function ThemeSwitch({
  theme,
  dict,
}: {
  theme: Theme;
  dict: Dictionary;
}) {
  const { theme: label, themes } = dict.header;
  const CurrentIcon = THEME_ICONS[theme];

  return (
    <form action={ROUTES.theme} method="post" aria-label={label}>
      <details className="group relative">
        {/* 좁은 화면에서는 그림만 남으므로 무엇을 여는 단추인지 이름으로 마저 알린다. */}
        <summary
          aria-label={`${label}: ${themes[theme]}`}
          className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden"
        >
          <CurrentIcon size={12} />
          <span className="hidden sm:inline">{themes[theme]}</span>
          <ChevronDownIcon
            size={12}
            className="transition-transform group-open:rotate-180"
          />
        </summary>

        <ul className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-md border border-border bg-surface py-1 text-xs shadow-lg">
          {THEMES.map((value) => {
            const Icon = THEME_ICONS[value];
            const selected = value === theme;

            return (
              <li key={value}>
                <button
                  type="submit"
                  name="theme"
                  value={value}
                  aria-current={selected ? "true" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left transition-colors ${
                    selected
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <Icon size={12} />
                  {themes[value]}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </form>
  );
}
