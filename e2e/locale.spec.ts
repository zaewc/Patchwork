import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * 접혀 있는 목록을 펼친 뒤 고른다.
 *
 * 머리에는 같은 모양의 전환 자리가 둘(언어·테마) 있다. 이름표는 보는 언어에 따라 바뀌므로
 * 폼이 어디로 보내는지로 가른다.
 */
const localeSwitch = (page: Page) => page.locator('form[action="/api/locale"]');

async function switchTo(page: Page, name: string) {
  await localeSwitch(page).locator("summary").click();
  await localeSwitch(page).getByRole("button", { name, exact: true }).click();
}

test.describe("로그인 전", () => {
  test("브라우저 언어(ko-KR)를 따라 한국어로 그린다", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "오픈소스 기여를 한 장의 Patchwork로",
      }),
    ).toBeVisible();
  });

  /** 언어 하나 바꾸자고 브라우저 스크립트를 싣지 않는다. `<details>`가 스스로 펼친다. */
  test("목록은 접혀 있다가 눌러야 펼쳐진다", async ({ page }) => {
    await page.goto("/");
    const option = localeSwitch(page).getByRole("button", {
      name: "English",
      exact: true,
    });

    await expect(option).toBeHidden();
    await localeSwitch(page).locator("summary").click();
    await expect(option).toBeVisible();
  });

  test("로그인하지 않아도 언어를 바꿀 수 있다", async ({ page }) => {
    await page.goto("/");
    await switchTo(page, "English");

    await expect(page).toHaveURL("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Your open source work, as one Patchwork",
      }),
    ).toBeVisible();
  });

  test("고른 언어는 쿠키에 남아 다음 화면에도 이어진다", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await switchTo(page, "English");

    const cookie = (await context.cookies()).find(
      (c) => c.name === "pw_locale",
    );
    expect(cookie?.value).toBe("en");
    expect(cookie?.httpOnly).toBe(true);

    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  /** 언어를 늘릴 때마다 한 줄 더한다. 목록에 올린 언어가 실제로 그려지는지 본다. */
  for (const { option, lang, heading } of [
    {
      option: "日本語",
      lang: "ja",
      heading: "オープンソースへの貢献を一枚のPatchworkに",
    },
    {
      option: "Русский",
      lang: "ru",
      heading: "Ваш вклад в открытый код — одним полотном",
    },
  ]) {
    test(`${option}로도 바꿀 수 있다`, async ({ page }) => {
      await page.goto("/");
      await switchTo(page, option);

      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    });
  }

  test("다시 한국어로 되돌릴 수 있다", async ({ page }) => {
    await page.goto("/");
    await switchTo(page, "English");
    await switchTo(page, "한국어");

    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  });
});

test.describe("로그인 후", () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn();
  });

  test("대시보드의 문구와 탭이 함께 영어가 된다", async ({ page }) => {
    await switchTo(page, "English");

    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Notable OSS" })).toBeVisible();
    await expect(page.getByRole("link", { name: "1 year" })).toBeVisible();
    await expect(page.getByText("Notable OSS contributions")).toBeVisible();
  });

  /** 헤더는 모든 화면에 있으므로 어디서 눌러도 보던 자리로 돌아와야 한다. */
  test("언어를 바꿔도 보던 조회 조건이 그대로다", async ({ page }) => {
    await page.goto("/dashboard?range=90d&scope=all");
    await switchTo(page, "English");

    await expect(page).toHaveURL("/dashboard?range=90d&scope=all");
    await expect(page.getByRole("link", { name: "90 days" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "All" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("내보내기 화면에서 눌러도 그 화면에 머문다", async ({ page }) => {
    await page.goto("/export?range=30d");
    await switchTo(page, "English");

    await expect(page).toHaveURL("/export?range=30d");
    await expect(
      page.getByRole("heading", { level: 1, name: "Export to README" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy Markdown" }),
    ).toBeVisible();
  });

  test("문서 제목의 설명도 함께 바뀐다", async ({ page }) => {
    await switchTo(page, "English");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Track your GitHub contributions and the pull requests still in flight.",
    );
  });
});
