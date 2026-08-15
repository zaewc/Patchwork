import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleSwitch } from "@/widgets/site-header/ui/LocaleSwitch";

const summary = () => screen.getByLabelText(/^언어:|^Language:/);
const option = (name: string) => screen.getByRole("button", { name });

describe("LocaleSwitch", () => {
  it("접힌 채로도 지금 보고 있는 언어를 보여준다", () => {
    render(<LocaleSwitch locale="ko" label="언어" />);

    expect(summary()).toHaveTextContent("한국어");
    expect(summary()).toHaveAccessibleName("언어: 한국어");
  });

  it("펼치면 아는 언어가 모두 있다", () => {
    render(<LocaleSwitch locale="ko" label="언어" />);

    expect(option("한국어")).toBeInTheDocument();
    expect(option("English")).toBeInTheDocument();
  });

  it("목록에서도 지금 보고 있는 언어를 표시한다", () => {
    render(<LocaleSwitch locale="en" label="Language" />);

    expect(option("English")).toHaveAttribute("aria-current", "true");
    expect(option("한국어")).not.toHaveAttribute("aria-current");
  });

  /** JavaScript 없이도 언어를 바꿀 수 있어야 한다. */
  it("고른 언어를 POST 폼으로 보낸다", () => {
    render(<LocaleSwitch locale="ko" label="언어" />);
    const form = screen.getByRole("form", { name: "언어" });

    expect(form).toHaveAttribute("action", "/api/locale");
    expect(form).toHaveAttribute("method", "post");
    expect(option("English")).toHaveAttribute("value", "en");
    expect(option("English")).toHaveAttribute("name", "locale");
  });

  it("처음에는 접혀 있다", () => {
    const { container } = render(<LocaleSwitch locale="ko" label="언어" />);
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  /**
   * 국기는 나라이지 언어가 아니다. 뜻을 지고 있는 것은 이름이므로,
   * 스크린 리더가 "대한민국 국기 한국어"라고 두 번 읽지 않게 감춘다.
   */
  it("국기는 곁다리라 스크린 리더에는 감춘다", () => {
    render(<LocaleSwitch locale="ko" label="언어" />);
    const flag = option("한국어").querySelector("img");

    expect(option("한국어")).toHaveAccessibleName("한국어");
    expect(flag).toHaveAttribute("aria-hidden", "true");
    expect(flag).toHaveAttribute("alt", "");
  });

  /** 이모지 국기는 Windows에 글꼴이 없어 `KR` 같은 글자로 떨어진다. 그림으로 받는다. */
  it("국기를 이모지가 아니라 그림으로 받는다", () => {
    render(<LocaleSwitch locale="ko" label="언어" />);

    const srcOf = (name: string) =>
      option(name).querySelector("img")?.getAttribute("src");

    expect(srcOf("한국어")).toContain("kr.svg");
    expect(srcOf("English")).toContain("us.svg");
  });
});
