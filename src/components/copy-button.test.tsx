import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "@/components/copy-button";

describe("CopyButton", () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (text: string) => {
    render(<CopyButton text={text} />);
    const button = screen.getByRole("button");
    const click = () => act(async () => void fireEvent.click(button));
    return { button, click };
  };

  it("처음에는 복사 안내를 보여준다", () => {
    const { button } = setup("본문");
    expect(button).toHaveTextContent("Markdown 복사");
  });

  it("누르면 클립보드에 담고 복사됨으로 바꾼다", async () => {
    const { button, click } = setup("### next.js");

    await click();

    expect(writeText).toHaveBeenCalledExactlyOnceWith("### next.js");
    expect(button).toHaveTextContent("복사됨");
  });

  it("1.5초가 지나면 원래 문구로 돌아온다", async () => {
    const { button, click } = setup("본문");

    await click();
    expect(button).toHaveTextContent("복사됨");

    await act(async () => void (await vi.advanceTimersByTimeAsync(1500)));
    expect(button).toHaveTextContent("Markdown 복사");
  });

  it("1.5초 전에는 복사됨을 유지한다", async () => {
    const { button, click } = setup("본문");

    await click();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1400)));
    expect(button).toHaveTextContent("복사됨");
  });

  it("연달아 누르면 마지막 본문을 담는다", async () => {
    const { click } = setup("본문");

    await click();
    await click();

    expect(writeText).toHaveBeenCalledTimes(2);
  });
});
