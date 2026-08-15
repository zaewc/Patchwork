import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from "@/shared/config";
import { DICTIONARIES, dictionaryOf } from "@/shared/lib/i18n-server";

/** 사전을 `a.b.c` → 문구 한 장으로 편다. 빠진 키를 눈으로 찾지 않기 위해서다. */
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };

  const entries = Object.entries(value as Record<string, unknown>);
  return Object.assign(
    {},
    ...entries.map(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    ),
  ) as Record<string, string>;
}

/** 문구에 남은 `{이름}` 자리. 번역하다 값 자리를 흘리면 여기서 걸린다. */
const placeholdersOf = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();

/**
 * 코드 조각 사이에 끼는 토막이라 언어에 따라 비어도 되는 자리.
 * 한국어 `.env.example 을 …`처럼 조각이 문장 맨 앞에 오면 앞 토막이 빈다.
 */
const MAY_BE_BLANK = new Set([
  "home.setup.step2.before",
  "home.setup.step2.after",
  "home.setup.step3.before",
  "home.setup.step3.middle",
  "home.setup.step3.after",
]);

/** 언어가 달라도 같은 것이 맞는 자리 — 우리 이름은 어디서나 Patchwork다. */
const SHARED_ACROSS_LOCALES = new Set(["metadata.title"]);

const FLAT = Object.fromEntries(
  LOCALES.map((locale) => [locale, flatten(dictionaryOf(locale))]),
) as Record<(typeof LOCALES)[number], Record<string, string>>;

/** 기준은 늘 기본 언어다. 새 언어는 이 목록에 이름만 올리면 아래 검사를 함께 받는다. */
const OTHERS = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

describe("dictionaryOf", () => {
  it("언어마다 자기 묶음을 준다", () => {
    expect(dictionaryOf("ko").locale).toBe("ko");
    expect(dictionaryOf("en").locale).toBe("en");
  });

  it("아는 언어 전부에 묶음이 있다", () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LOCALES].sort());
  });

  it("묶음이 스스로 어느 언어인지 옳게 말한다", () => {
    for (const locale of LOCALES) {
      expect(dictionaryOf(locale).locale).toBe(locale);
    }
  });

  it("아는 언어 전부에 그 언어로 적은 이름과 표시가 있다", () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale].name.trim()).not.toBe("");
      expect(LOCALE_LABELS[locale].countryCode).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("번역 짝 맞추기", () => {
  it.each(OTHERS)("%s가 기본 언어와 똑같은 키를 갖는다", (locale) => {
    expect(Object.keys(FLAT[locale]).sort()).toEqual(
      Object.keys(FLAT[DEFAULT_LOCALE]).sort(),
    );
  });

  it.each(LOCALES)("%s는 빈 문구를 남기지 않는다", (locale) => {
    const blank = Object.entries(FLAT[locale])
      .filter(([key, text]) => text.trim() === "" && !MAY_BE_BLANK.has(key))
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  it.each(OTHERS)(
    "%s가 값이 끼어드는 자리를 기본 언어와 똑같이 갖는다",
    (locale) => {
      for (const key of Object.keys(FLAT[DEFAULT_LOCALE])) {
        expect({ key, slots: placeholdersOf(FLAT[locale][key] ?? "") }).toEqual(
          {
            key,
            slots: placeholdersOf(FLAT[DEFAULT_LOCALE][key]!),
          },
        );
      }
    },
  );

  /**
   * 새 언어는 대개 기존 사전을 복사해 만든다. 그러다 번역을 빠뜨리면 그 자리만
   * 원본과 글자가 같아진다. 두 언어가 한 글자도 다르지 않은 자리를 모두 세어
   * 그런 흔적을 잡는다 — 정말 같아야 하는 것은 아래 목록에 적어 둔다.
   */
  it("어느 두 언어도 같은 문구를 그대로 쓰지 않는다", () => {
    const shared = Object.keys(FLAT[DEFAULT_LOCALE])
      .filter(
        (key) => !SHARED_ACROSS_LOCALES.has(key) && !MAY_BE_BLANK.has(key),
      )
      .filter((key) => {
        const written = LOCALES.map((locale) => FLAT[locale][key]);
        return new Set(written).size < written.length;
      });

    expect(shared).toEqual([]);
  });
});
