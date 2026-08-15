import { describe, expect, it } from "vitest";
import { interpolate } from "@/shared/lib/i18n";

describe("interpolate", () => {
  it("이름이 같은 자리를 값으로 채운다", () => {
    expect(interpolate("repository {count}곳", { count: 3 })).toBe(
      "repository 3곳",
    );
  });

  it("자리가 여럿이어도 각각 채운다", () => {
    expect(
      interpolate("{repos} repositories · {items} items", {
        repos: 2,
        items: 4,
      }),
    ).toBe("2 repositories · 4 items");
  });

  it("같은 이름이 두 번 나오면 두 번 다 채운다", () => {
    expect(interpolate("{n}/{n}", { n: 1 })).toBe("1/1");
  });

  it("채울 자리가 없으면 그대로 둔다", () => {
    expect(interpolate("Repositories", { count: 1 })).toBe("Repositories");
  });

  /** 번역이 빠진 자리를 조용히 지우면 알아채기 어렵다. */
  it("값이 없는 자리는 그대로 남긴다", () => {
    expect(interpolate("{count}건 · {unknown}", { count: 2 })).toBe(
      "2건 · {unknown}",
    );
  });

  it("문자열 값도 그대로 넣는다", () => {
    expect(interpolate("Contributions · {range}", { range: "1년" })).toBe(
      "Contributions · 1년",
    );
  });
});
