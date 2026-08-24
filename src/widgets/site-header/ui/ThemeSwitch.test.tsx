import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeSwitch } from "@/widgets/site-header/ui/ThemeSwitch";
import { THEMES } from "@/shared/config";
import { dictionaryOf } from "@/shared/lib/i18n-server";

const KO = dictionaryOf("ko");
const EN = dictionaryOf("en");

const summary = () => screen.getByLabelText(/^테마:|^Theme:/);
const option = (name: string) => screen.getByRole("button", { name });

describe("ThemeSwitch", () => {
  it("접힌 채로도 지금 고른 것을 보여준다", () => {
    render(<ThemeSwitch theme="dark" dict={KO} />);

    expect(summary()).toHaveTextContent("어둡게");
    expect(summary()).toHaveAccessibleName("테마: 어둡게");
  });

  it("펼치면 셋 모두 있다", () => {
    render(<ThemeSwitch theme="system" dict={KO} />);

    expect(option("시스템 설정")).toBeInTheDocument();
    expect(option("밝게")).toBeInTheDocument();
    expect(option("어둡게")).toBeInTheDocument();
  });

  it("목록에서도 지금 고른 것을 표시한다", () => {
    render(<ThemeSwitch theme="light" dict={KO} />);

    expect(option("밝게")).toHaveAttribute("aria-current", "true");
    expect(option("어둡게")).not.toHaveAttribute("aria-current");
  });

  /** JavaScript 없이도 색을 바꿀 수 있어야 한다. */
  it("고른 테마를 POST 폼으로 보낸다", () => {
    render(<ThemeSwitch theme="system" dict={KO} />);
    const form = screen.getByRole("form", { name: "테마" });

    expect(form).toHaveAttribute("action", "/api/theme");
    expect(form).toHaveAttribute("method", "post");
    for (const theme of THEMES) {
      expect(option(KO.header.themes[theme])).toHaveAttribute("value", theme);
    }
    expect(option("밝게")).toHaveAttribute("name", "theme");
  });

  it("사전을 바꾸면 문구도 함께 바뀐다", () => {
    render(<ThemeSwitch theme="system" dict={EN} />);

    expect(summary()).toHaveAccessibleName("Theme: System");
    expect(option("Dark")).toBeInTheDocument();
  });

  /** 그림은 곁다리다. 뜻은 늘 이름이 지므로 스크린 리더에는 감춘다. */
  it("그림은 스크린 리더에 감춘다", () => {
    const { container } = render(<ThemeSwitch theme="dark" dict={KO} />);

    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("접힌 채로는 좁은 화면에서 그림만 남는다", () => {
    render(<ThemeSwitch theme="dark" dict={KO} />);

    expect(summary().querySelector("span")).toHaveClass("hidden", "lg:inline");
  });
});
