import {
  CONTRIBUTIONS,
  IMPACT,
  EXTERNAL,
  EXTERNAL_RATIO,
  MERGED_PULL_REQUESTS,
  NOTABLE,
  OPEN_PULL_REQUESTS,
  REPO_ORDER,
  RESTRICTED,
} from "./expected";
import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const statCard = (page: Page, label: string) =>
  page
    .locator("div")
    .filter({ has: page.getByText(label, { exact: true }) })
    .last();

const section = (page: Page, title: string) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: title }) });

test.beforeEach(async ({ signIn }) => {
  await signIn();
});

test.describe("지표", () => {
  test("전체 기여 수와 비공개 기여를 보여준다", async ({ page }) => {
    const card = statCard(page, "Contributions");

    await expect(
      card.getByText(String(CONTRIBUTIONS), { exact: true }),
    ).toBeVisible();
    await expect(card.getByText(`Private ${RESTRICTED}건 포함`)).toBeVisible();
  });

  test("주요 OSS 기여와 repository 수를 보여준다", async ({ page }) => {
    const card = statCard(page, "주요 OSS 기여");

    await expect(
      card.getByText(String(NOTABLE.contributions), { exact: true }),
    ).toBeVisible();
    await expect(card.getByText(`repository ${NOTABLE.repos}곳`)).toBeVisible();
  });

  test("외부 repository 기여 비중을 보여준다", async ({ page }) => {
    const card = statCard(page, "외부 Repository 기여");

    await expect(
      card.getByText(String(EXTERNAL), { exact: true }),
    ).toBeVisible();
    await expect(card.getByText(`전체의 ${EXTERNAL_RATIO}%`)).toBeVisible();
  });

  test("주요 OSS 모드에서는 걸러진 열린 PR 수를 센다", async ({ page }) => {
    const card = statCard(page, "Open pull requests");

    await expect(
      card.getByText(String(OPEN_PULL_REQUESTS.notable), { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText(`Stale ${OPEN_PULL_REQUESTS.stale}건`),
    ).toBeVisible();
  });

  test("전체 모드에서는 GitHub이 준 전체 건수를 쓴다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();

    await expect(
      statCard(page, "Open pull requests").getByText(
        String(OPEN_PULL_REQUESTS.all),
        {
          exact: true,
        },
      ),
    ).toBeVisible();
  });
});

test.describe("기여 달력", () => {
  test("날짜별 칸에 기여 수를 붙인다", async ({ page }) => {
    const cells = page.locator('[title$="contributions"]');

    await expect(cells.first()).toBeVisible();
    expect(await cells.count()).toBeGreaterThan(80);
  });

  test("범례로 단계를 설명한다", async ({ page }) => {
    await expect(page.getByText("Less")).toBeVisible();
    await expect(page.getByText("More")).toBeVisible();
  });

  test("요일 눈금을 붙인다", async ({ page }) => {
    for (const label of ["Mon", "Wed", "Fri"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

test.describe("조회 범위", () => {
  test("기간 탭이 URL과 제목을 함께 바꾼다", async ({ page }) => {
    await page.getByRole("link", { name: "30일" }).click();

    await expect(page).toHaveURL("/dashboard?range=30d");
    await expect(
      page.getByRole("heading", { name: "Contributions · 30일" }),
    ).toBeVisible();
  });

  test("5년은 구간을 나눠 부르고도 합계를 두 번 세지 않는다", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "5년" }).click();

    await expect(page).toHaveURL("/dashboard?range=5y");
    await expect(
      page.getByRole("heading", { name: "Contributions · 5년" }),
    ).toBeVisible();
    await expect(
      statCard(page, "Contributions").getByText(String(CONTRIBUTIONS), {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("범위를 바꿔도 전체 보기는 유지된다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();
    await page.getByRole("link", { name: "90일" }).click();

    await expect(page).toHaveURL("/dashboard?range=90d&scope=all");
    await expect(page.getByRole("link", { name: "전체" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("URL로 바로 들어가도 그 조건으로 그린다", async ({ page }) => {
    await page.goto("/dashboard?range=90d&scope=all");

    await expect(page.getByRole("link", { name: "90일" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "전체" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("한 번 본 기간으로 돌아오면 다시 받아 오지 않는다", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/dashboard")) calls.push(request.url());
    });

    await page.getByRole("link", { name: "30일" }).click();
    await expect(
      page.getByRole("heading", { name: "Contributions · 30일" }),
    ).toBeVisible();
    expect(calls).toHaveLength(1);

    await page.getByRole("link", { name: "1년" }).click();
    await expect(
      page.getByRole("heading", { name: "Contributions · 1년" }),
    ).toBeVisible();
    // 1년치는 서버가 첫 화면에 심어 준 것이라 되돌아와도 물어볼 일이 없다.
    expect(calls).toHaveLength(1);
  });

  test("보기 범위 전환은 서버에 다시 묻지 않는다", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/dashboard")) calls.push(request.url());
    });

    await page.getByRole("link", { name: "전체" }).click();

    await expect(page).toHaveURL("/dashboard?range=1y&scope=all");
    await expect(page.getByRole("link", { name: "전체" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // 걸러내기는 이미 받아 둔 목록에서 한다.
    expect(calls).toEqual([]);
  });

  test("모르는 범위는 1년으로 떨어진다", async ({ page }) => {
    await page.goto("/dashboard?range=100y");
    await expect(
      page.getByRole("heading", { name: "Contributions · 1년" }),
    ).toBeVisible();
  });
});

test.describe("새로고침", () => {
  test("페이지를 다시 열지 않고 바뀐 데이터를 가져온다", async ({
    page,
    scenario,
  }) => {
    await expect(
      section(page, "Repositories").getByRole("link", {
        name: "vercel/next.js",
      }),
    ).toBeVisible();
    await scenario("empty");

    const response = page.waitForResponse(
      (candidate) => new URL(candidate.url()).pathname === "/api/dashboard",
    );
    await page.getByRole("button", { name: "새로고침" }).click();

    expect((await response).status()).toBe(200);
    await expect(
      page.getByText("이 기간에 기여한 repository가 없습니다."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "새로고침" })).toBeEnabled();
  });
});

test.describe("Repositories", () => {
  test("주요 OSS만 남긴다", async ({ page }) => {
    const table = section(page, "Repositories");

    await expect(
      table.getByRole("link", { name: "vercel/next.js" }),
    ).toBeVisible();
    await expect(
      table.getByRole("link", { name: "someone/toy-lib" }),
    ).toHaveCount(0);
    await expect(
      table.getByRole("link", { name: "octocat/patchwork" }),
    ).toHaveCount(0);
  });

  test("전체 모드에서는 합계 내림차순으로 모두 보여준다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();
    const links = section(page, "Repositories").getByRole("link");

    await expect(links).toHaveText(REPO_ORDER);
  });

  test("OpenSSF Scorecard 점수를 설명으로 붙인다", async ({ page }) => {
    await expect(
      section(page, "Repositories").getByRole("link", {
        name: "vercel/next.js",
      }),
    ).toHaveAttribute("title", `권위 점수 ${IMPACT.nextJs}/100`);
  });

  test("비공개 repository는 Private으로 표시한다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();

    await expect(
      section(page, "Repositories").getByText("Private"),
    ).toBeVisible();
  });

  test("항목별 기여 수와 합계를 보여준다", async ({ page }) => {
    const row = section(page, "Repositories").getByRole("row").nth(1);

    await expect(row).toContainText("vercel/next.js");
    await expect(row.getByRole("cell")).toHaveText([
      "vercel/next.js",
      "40",
      "5",
      "2",
      "1",
      "48",
    ]);
  });
});

test.describe("Open pull requests", () => {
  test("검토 상태별로 열을 나눈다", async ({ page }) => {
    const board = section(page, "Open pull requests");

    for (const title of [
      "Changes requested",
      "Review required",
      "Approved",
      "Draft",
    ]) {
      await expect(
        board.getByRole("heading", { name: new RegExp(`^${title}`) }),
      ).toBeVisible();
    }
  });

  test("PR을 알맞은 열에 놓는다", async ({ page }) => {
    const board = section(page, "Open pull requests");
    const column = (title: string) =>
      board
        .locator("section")
        .filter({
          has: page.getByRole("heading", { name: new RegExp(`^${title}`) }),
        });

    await expect(column("Review required")).toContainText(
      "fix: hydration mismatch",
    );
    await expect(column("Approved")).toContainText(
      "feat: turbopack 플래그 추가",
    );
    await expect(column("Draft")).toContainText("chore: 초안");
    await expect(column("Changes requested")).toContainText(
      "refactor: 변경 요청 받은 PR",
    );
  });

  test("체크 결과와 stale을 알려준다", async ({ page }) => {
    const board = section(page, "Open pull requests");

    await expect(board.getByText("Checks passed").first()).toBeVisible();
    await expect(board.getByText("Checks failed")).toBeVisible();
    await expect(board.getByText("Stale")).toBeVisible();
  });

  test("제목은 GitHub PR로 이어진다", async ({ page }) => {
    const link = section(page, "Open pull requests").getByRole("link", {
      name: /fix: hydration mismatch/,
    });

    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/vercel/next.js/pull/101",
    );
  });

  test("전체 모드에서는 일반 프로젝트의 PR까지 보여준다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();

    await expect(
      section(page, "Open pull requests").getByText("docs: 오타 수정"),
    ).toBeVisible();
  });
});

test.describe("Recently merged", () => {
  test("주요 OSS의 merge된 PR만 남긴다", async ({ page }) => {
    const merged = section(page, "Recently merged");

    await expect(merged.getByRole("listitem")).toHaveCount(
      MERGED_PULL_REQUESTS.notable,
    );
    await expect(merged).toContainText("perf: 번들 크기 줄이기");
  });

  test("전체 모드에서는 모두 보여준다", async ({ page }) => {
    await page.getByRole("link", { name: "전체" }).click();

    await expect(
      section(page, "Recently merged").getByRole("listitem"),
    ).toHaveCount(MERGED_PULL_REQUESTS.all);
  });
});

test.describe("기여가 없을 때", () => {
  test("각 구역의 기본 안내를 보여준다", async ({ page, scenario }) => {
    await scenario("empty");
    await page.goto("/dashboard");

    await expect(
      page.getByText("이 기간에 기여한 repository가 없습니다."),
    ).toBeVisible();
    await expect(
      page.getByText("열려 있는 pull request가 없습니다."),
    ).toBeVisible();
    await expect(
      page.getByText("이 기간에 merge된 pull request가 없습니다."),
    ).toBeVisible();
  });
});

test.describe("deps.dev가 죽었을 때", () => {
  test("점수를 못 받아도 대시보드는 그려진다", async ({ page, scenario }) => {
    await scenario("scorecards-failure");
    await page.goto("/dashboard");

    await expect(
      statCard(page, "Contributions").getByText(String(CONTRIBUTIONS), {
        exact: true,
      }),
    ).toBeVisible();
    // Scorecard가 없으면 외부 관심(stars 100,000 · forks 20,000)만으로 60점 — 경계선에 닿는다.
    await expect(
      section(page, "Repositories").getByRole("link", {
        name: "vercel/next.js",
      }),
    ).toHaveAttribute("title", "권위 점수 60/100");
  });
});

test.describe("일부만 실패했을 때", () => {
  test("PR 조회만 실패하면 경고와 함께 나머지를 보여준다", async ({
    page,
    scenario,
  }) => {
    await scenario("pull-requests-failure");
    await page.goto("/dashboard");

    await expect(page.getByText("PR 검색이 실패했습니다.")).toBeVisible();
    await expect(
      statCard(page, "Contributions").getByText(String(CONTRIBUTIONS), {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("열려 있는 pull request가 없습니다."),
    ).toBeVisible();
  });
});

test.describe("조회가 실패했을 때", () => {
  test("사유와 재시도 링크를 보여준다", async ({ page, scenario }) => {
    await scenario("contributions-failure");
    await page.goto("/dashboard?range=90d");

    await expect(
      page.getByRole("heading", { name: "데이터를 불러오지 못했습니다" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "기여한 Repository가 많아 집계 쿼리가 제한 시간을 넘겼습니다.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/dashboard?range=90d",
    );
  });

  test("재시도 링크는 조건을 유지한 채 다시 그린다", async ({
    page,
    scenario,
  }) => {
    await scenario("contributions-failure");
    await page.goto("/dashboard?range=90d&scope=all");
    await scenario("default");

    await page.getByRole("link", { name: "다시 시도" }).click();

    await expect(page).toHaveURL("/dashboard?range=90d&scope=all");
    await expect(
      page.getByRole("heading", { name: "Contributions · 90일" }),
    ).toBeVisible();
  });

  test("토큰이 만료되면 다시 로그인하도록 안내한다", async ({
    page,
    scenario,
  }) => {
    await scenario("token-expired");
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "세션이 만료되었습니다" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "다시 로그인" }),
    ).toHaveAttribute("href", "/api/auth/login");
  });
});
