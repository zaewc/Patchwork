import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  matchLocale,
  parseLocale,
} from "@/shared/config/locale";

describe("parseLocale", () => {
  it("우리가 아는 언어만 통과시킨다", () => {
    expect(parseLocale("ko")).toBe("ko");
    expect(parseLocale("en")).toBe("en");
  });

  it("모르는 값은 null이다", () => {
    expect(parseLocale("fr")).toBeNull();
    expect(parseLocale("ko-KR")).toBeNull();
    expect(parseLocale("")).toBeNull();
  });

  it("문자열이 아니면 null이다", () => {
    expect(parseLocale(undefined)).toBeNull();
    expect(parseLocale(null)).toBeNull();
    expect(parseLocale(42)).toBeNull();
  });
});

describe("matchLocale", () => {
  it("헤더가 없으면 기본 언어다", () => {
    expect(matchLocale(null)).toBe(DEFAULT_LOCALE);
    expect(matchLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(matchLocale("")).toBe(DEFAULT_LOCALE);
  });

  it("지역이 붙어 있어도 앞의 언어 코드로 맞춘다", () => {
    expect(matchLocale("ko-KR")).toBe("ko");
    expect(matchLocale("en-US")).toBe("en");
  });

  it("q가 큰 언어를 먼저 본다", () => {
    expect(matchLocale("fr;q=1.0,en-US;q=0.8,ko;q=0.5")).toBe("en");
    expect(matchLocale("en;q=0.5,ko;q=0.9")).toBe("ko");
  });

  it("q가 없으면 1로 보고 적힌 순서를 따른다", () => {
    expect(matchLocale("en,ko;q=0.9")).toBe("en");
  });

  it("q=0인 언어는 거절한 것으로 본다", () => {
    expect(matchLocale("en;q=0,ko;q=0.1")).toBe("ko");
  });

  it("아는 언어가 하나도 없으면 기본 언어다", () => {
    expect(matchLocale("fr-FR,de;q=0.8")).toBe(DEFAULT_LOCALE);
    expect(matchLocale("*")).toBe(DEFAULT_LOCALE);
  });

  it("빈 조각이 섞여 있어도 넘어간다", () => {
    expect(matchLocale(",,en")).toBe("en");
  });

  it("q가 숫자가 아니면 그 항목은 버린다", () => {
    expect(matchLocale("en;q=abc,ko")).toBe("ko");
  });
});

describe("LOCALES", () => {
  it("기본 언어는 목록 안에 있다", () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });
});
