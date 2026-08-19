import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const LIGHT_BG = "rgb(251, 249, 245)";
const DARK_BG = "rgb(19, 18, 16)";

/** 머리에는 같은 모양의 전환 자리가 둘 있다. 폼이 어디로 보내는지로 가른다. */
const themeSwitch = (page: Page) => page.locator('form[action="/api/theme"]');

async function chooseTheme(page: Page, name: string) {
  await themeSwitch(page).locator("summary").click();
  await themeSwitch(page).getByRole("button", { name, exact: true }).click();
}

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe("운영체제가 어두울 때", () => {
  test.use({ colorScheme: "dark" });

  test("고른 적이 없으면 운영체제를 따른다", async ({ page }) => {
    await page.goto("/");

    // 고르지 않았다는 것은 속성이 없다는 뜻이고, 색은 CSS가 정한다.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await bodyBackground(page)).toBe(DARK_BG);
  });

  test("밝게를 고르면 운영체제가 어두워도 밝게 그린다", async ({ page }) => {
    await page.goto("/");
    await chooseTheme(page, "밝게");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await bodyBackground(page)).toBe(LIGHT_BG);
  });
});

test.describe("운영체제가 밝을 때", () => {
  test.use({ colorScheme: "light" });

  test("고른 적이 없으면 운영체제를 따른다", async ({ page }) => {
    await page.goto("/");
    expect(await bodyBackground(page)).toBe(LIGHT_BG);
  });

  test("어둡게를 고르면 운영체제가 밝아도 어둡게 그린다", async ({ page }) => {
    await page.goto("/");
    await chooseTheme(page, "어둡게");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await bodyBackground(page)).toBe(DARK_BG);
  });

  test("시스템 설정으로 되돌릴 수 있다", async ({ page }) => {
    await page.goto("/");
    await chooseTheme(page, "어둡게");
    await chooseTheme(page, "시스템 설정");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await bodyBackground(page)).toBe(LIGHT_BG);
  });
});

test.describe("고른 것을 지키는 법", () => {
  /** 색 하나 바꾸자고 브라우저 스크립트를 싣지 않는다. `<details>`가 스스로 펼친다. */
  test("목록은 접혀 있다가 눌러야 펼쳐진다", async ({ page }) => {
    await page.goto("/");
    const option = themeSwitch(page).getByRole("button", {
      name: "어둡게",
      exact: true,
    });

    await expect(option).toBeHidden();
    await themeSwitch(page).locator("summary").click();
    await expect(option).toBeVisible();
  });

  test("로그인하지 않아도 바꿀 수 있다", async ({ page, context }) => {
    await page.goto("/");
    await chooseTheme(page, "어둡게");

    await expect(page).toHaveURL("/");
    const cookie = (await context.cookies()).find((c) => c.name === "pw_theme");
    expect(cookie?.value).toBe("dark");
    expect(cookie?.httpOnly).toBe(true);
  });

  /**
   * 첫 HTML에 이미 실려 온다는 것이 이 방식의 핵심이다. 브라우저에서 색을 고치는 흔한
   * 방법은 스크립트가 켜지기 전까지 반대 색이 번쩍인다.
   */
  test("다음 화면도 첫 HTML부터 그 색이다", async ({ page, signIn }) => {
    await page.goto("/");
    await chooseTheme(page, "어둡게");

    await signIn();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await bodyBackground(page)).toBe(DARK_BG);
  });

  test("테마를 바꿔도 보던 조회 조건이 그대로다", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/dashboard?range=90d&scope=all");

    await chooseTheme(page, "어둡게");

    await expect(page).toHaveURL("/dashboard?range=90d&scope=all");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("언어를 바꿔도 고른 색은 그대로다", async ({ page }) => {
    await page.goto("/");
    await chooseTheme(page, "어둡게");

    await page.locator('form[action="/api/locale"] summary').click();
    await page
      .locator('form[action="/api/locale"]')
      .getByRole("button", { name: "English", exact: true })
      .click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByLabel("Theme: Dark", { exact: true })).toBeVisible();
  });
});
