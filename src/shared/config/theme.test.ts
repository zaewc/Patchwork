import { describe, expect, it } from "vitest";
import { parseTheme, themeAttribute, THEMES } from "@/shared/config/theme";

describe("parseTheme", () => {
  it.each(THEMES)("아는 테마 %s는 그대로 통과시킨다", (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });

  /** 쿠키·폼처럼 바깥에서 온 값이 들어오는 자리다. */
  it.each([["solarized"], [""], [null], [undefined], [42], [{}]])(
    "모르는 값 %s는 null이다",
    (value) => {
      expect(parseTheme(value)).toBeNull();
    },
  );
});

describe("themeAttribute", () => {
  /** 속성이 없는 것 자체가 "운영체제를 따르라"는 뜻이다. */
  it("고르지 않았으면 아무것도 적지 않는다", () => {
    expect(themeAttribute("system")).toBeUndefined();
  });

  it("골라 둔 것은 그대로 적는다", () => {
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("dark")).toBe("dark");
  });
});
