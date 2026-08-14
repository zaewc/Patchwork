import { EXPORT_ITEMS } from "./expected";
import { expect, test } from "./fixtures";

test.beforeEach(async ({ page, signIn }) => {
  await signIn();
  await page.getByRole("link", { name: "README" }).click();
  await expect(page).toHaveURL(/\/export/);
});

test.describe("Markdown 만들기", () => {
  test("무엇을 만드는 화면인지 설명한다", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "README 내보내기" })).toBeVisible();
    await expect(page.getByText(/repository별로 묶어 Markdown으로 만듭니다/)).toBeVisible();
  });

  test("주요 OSS의 결론난 기여만 담는다", async ({ page }) => {
    const markdown = await page.locator("pre").innerText();

    expect(markdown).toContain("### next.js");
    for (const title of EXPORT_ITEMS.notableTitles) {
      // 제목의 대괄호는 링크가 깨지지 않도록 이스케이프된다.
      expect(markdown).toContain(title.replace(/[[\]]/g, "\\$&"));
    }
  });

  test("결론이 나지 않은 기여는 빼놓는다", async ({ page }) => {
    const markdown = await page.locator("pre").innerText();

    for (const title of EXPORT_ITEMS.excluded) {
      expect(markdown).not.toContain(title);
    }
  });

  test("한 repository 안에서는 시간순으로 세운다", async ({ page }) => {
    const markdown = await page.locator("pre").innerText();
    const positions = EXPORT_ITEMS.notableTitles.map((title) =>
      markdown.indexOf(title.replace(/[[\]]/g, "\\$&")),
    );

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((position) => position >= 0)).toBe(true);
  });

  test("PR과 issue를 구분해 적는다", async ({ page }) => {
    const markdown = await page.locator("pre").innerText();

    expect(markdown).toContain("**PR** |");
    expect(markdown).toContain("**Issue** |");
  });

  test("링크는 GitHub 주소를 그대로 쓴다", async ({ page }) => {
    await expect(page.locator("pre")).toContainText("https://github.com/vercel/next.js/pull/99");
  });

  test("repository 수와 항목 수를 센다", async ({ page }) => {
    await expect(page.getByText("repository 1곳 · 3건")).toBeVisible();
  });
});

test.describe("복사", () => {
  test("버튼을 누르면 클립보드에 담고 복사됨으로 바꾼다", async ({ page }) => {
    const markdown = await page.locator("pre").innerText();
    const button = page.getByRole("button", { name: "Markdown 복사" });

    await button.click();

    await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(markdown);
  });

  test("잠시 뒤 원래 문구로 돌아온다", async ({ page }) => {
    await page.getByRole("button", { name: "Markdown 복사" }).click();
    await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Markdown 복사" })).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("걸러내기", () => {
  test("전체로 전환하면 일반 프로젝트까지 담는다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();

    await expect(page).toHaveURL("/export?range=1y&scope=all");
    await expect(page.locator("pre")).toContainText("### toy-lib");
    await expect(page.getByText("repository 2곳 · 4건")).toBeVisible();
  });

  test("기여가 많은 repository를 앞에 둔다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();
    await expect(page.locator("pre")).toContainText("### toy-lib");

    const markdown = await page.locator("pre").innerText();
    expect(markdown.indexOf("### next.js")).toBeLessThan(markdown.indexOf("### toy-lib"));
  });

  test("탭은 내보내기 화면에 머문다", async ({ page }) => {
    await page.getByRole("link", { name: "30일" }).click();

    await expect(page).toHaveURL("/export?range=30d");
    await expect(page.getByRole("heading", { level: 1, name: "README 내보내기" })).toBeVisible();
  });

  test("URL로 바로 들어가도 그 조건으로 그린다", async ({ page }) => {
    await page.goto("/export?range=5y&scope=all");

    await expect(page.getByRole("link", { name: "5년" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "전체" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("내보낼 것이 없을 때", () => {
  test("기간을 넓히거나 전체로 전환하라고 안내한다", async ({ page, scenario }) => {
    await scenario("empty");
    await page.goto("/export");

    await expect(page.locator("pre")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Markdown 복사" })).toHaveCount(0);
    await expect(
      page.getByText(
        "이 기간에 merge된 pull request나 완료된 issue가 없습니다. 기간을 넓히거나 전체로 전환해 보세요.",
      ),
    ).toBeVisible();
    await expect(page.getByText("repository 0곳 · 0건")).toBeVisible();
  });
});

test.describe("조회가 실패했을 때", () => {
  test("사유를 알리고 다시 시도하라고 안내한다", async ({ page, scenario }) => {
    await scenario("items-failure");
    await page.goto("/export");

    await expect(page.getByText("기여 목록을 불러오지 못했습니다.")).toBeVisible();
    await expect(page.getByText("다시 시도해 주세요.")).toBeVisible();
    await expect(page.locator("pre")).toHaveCount(0);
  });

  test("토큰이 만료되면 다시 로그인하러 보낸다", async ({ page, scenario }) => {
    await scenario("token-expired");
    await page.goto("/export");

    // /api/auth/login 은 다시 GitHub 인가로 이어지므로 결국 대시보드로 돌아온다.
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
