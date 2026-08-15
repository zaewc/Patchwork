import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  RefreshIcon,
  SignOutIcon,
} from "@/shared/ui/icon";

const ICONS = [
  { name: "RefreshIcon", Icon: RefreshIcon },
  { name: "SignOutIcon", Icon: SignOutIcon },
  { name: "CopyIcon", Icon: CopyIcon },
  { name: "CheckIcon", Icon: CheckIcon },
  { name: "ChevronDownIcon", Icon: ChevronDownIcon },
] as const;

describe.each(ICONS)("$name", ({ Icon }) => {
  const renderIcon = (props?: { size?: number; className?: string }) =>
    render(<Icon {...props} />).container.querySelector("svg");

  it("곁들이는 글자에 맞춘 14px로 그린다", () => {
    const svg = renderIcon();

    expect(svg).toHaveAttribute("width", "14");
    expect(svg).toHaveAttribute("height", "14");
  });

  it("크기를 지정하면 그 크기로 그린다", () => {
    const svg = renderIcon({ size: 24 });

    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("뜻은 옆의 글자가 말하므로 스크린 리더에는 감춘다", () => {
    expect(renderIcon()).toHaveAttribute("aria-hidden", "true");
  });

  it("글자 색을 그대로 따른다", () => {
    expect(renderIcon()).toHaveAttribute("stroke", "currentColor");
  });

  it("좁은 자리에서도 찌그러지지 않는다", () => {
    expect(renderIcon()).toHaveClass("shrink-0");
  });

  it("바깥에서 준 class를 함께 붙인다", () => {
    expect(renderIcon({ className: "motion-safe:animate-spin" })).toHaveClass(
      "shrink-0",
      "motion-safe:animate-spin",
    );
  });
});
