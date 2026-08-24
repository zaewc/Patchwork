import { expect, test } from "./fixtures";

test.describe("로그인 전", () => {
  test("랜딩에서 서비스 소개와 로그인 버튼을 보여준다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "오픈소스 기여를 한 장의 Patchwork로",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign in with GitHub" }),
    ).toBeVisible();
  });

  test("문서 제목을 채운다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Patchwork");
  });

  test("대시보드에 바로 들어가면 홈으로 돌린다", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("link", { name: "Sign in with GitHub" }),
    ).toBeVisible();
  });

  test("내보내기 화면에 바로 들어가면 홈으로 돌린다", async ({ page }) => {
    await page.goto("/export");
    await expect(page).toHaveURL("/");
  });
});

test.describe("OAuth 흐름", () => {
  test("로그인하면 대시보드로 들어간다", async ({ page, signIn }) => {
    await signIn();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { level: 1, name: "The Octocat" }),
    ).toBeVisible();
  });

  test("로그인 후에는 홈이 대시보드로 넘긴다", async ({ page, signIn }) => {
    await signIn();
    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("세션 쿠키는 httpOnly로 심는다", async ({ context, signIn }) => {
    await signIn();

    const session = (await context.cookies()).find(
      (cookie) => cookie.name === "pw_session",
    );
    expect(session).toBeDefined();
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
  });

  test("쓰임을 다한 state 쿠키는 남기지 않는다", async ({
    context,
    signIn,
  }) => {
    await signIn();

    const state = (await context.cookies()).find(
      (cookie) => cookie.name === "pw_oauth_state",
    );
    expect(state?.value ?? "").toBe("");
  });

  test("인가를 취소하면 사유를 알려준다", async ({ page, scenario }) => {
    await scenario("oauth-denied");
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in with GitHub" }).click();

    await expect(page).toHaveURL("/?error=access_denied");
    await expect(
      page.getByText("GitHub 로그인이 취소되었습니다."),
    ).toBeVisible();
  });

  test("state가 어긋나면 다시 시도하라고 안내한다", async ({
    page,
    scenario,
  }) => {
    await scenario("oauth-state-mismatch");
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in with GitHub" }).click();

    await expect(page).toHaveURL("/?error=invalid_state");
    await expect(
      page.getByText("로그인 요청이 만료되었습니다. 다시 시도해 주세요."),
    ).toBeVisible();
  });

  test("토큰 교환이 실패하면 자격증명을 확인하라고 안내한다", async ({
    page,
    scenario,
  }) => {
    await scenario("token-http-failure");
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in with GitHub" }).click();

    await expect(page).toHaveURL("/?error=token_exchange_failed");
    await expect(
      page.getByText(
        "토큰 교환에 실패했습니다. Client ID/Secret을 확인해 주세요.",
      ),
    ).toBeVisible();
  });

  test("GitHub이 거절 사유를 주면 그대로 전달한다", async ({
    page,
    scenario,
  }) => {
    await scenario("token-rejected");
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in with GitHub" }).click();

    await expect(page).toHaveURL("/?error=bad_verification_code");
    await expect(
      page.getByText("로그인 중 문제가 발생했습니다."),
    ).toBeVisible();
  });

  test("사용자 정보를 못 가져오면 안내한다", async ({ page, scenario }) => {
    await scenario("identity-failure");
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in with GitHub" }).click();

    await expect(page).toHaveURL("/?error=identity_failed");
    await expect(
      page.getByText("GitHub 사용자 정보를 가져오지 못했습니다."),
    ).toBeVisible();
  });
});

test.describe("로그아웃", () => {
  test("로그아웃하면 홈으로 돌아가고 세션이 사라진다", async ({
    page,
    context,
    signIn,
  }) => {
    await signIn();
    await page.getByLabel("The Octocat", { exact: true }).click();
    await page.getByRole("button", { name: "로그아웃" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("link", { name: "Sign in with GitHub" }),
    ).toBeVisible();

    const session = (await context.cookies()).find(
      (cookie) => cookie.name === "pw_session",
    );
    expect(session?.value ?? "").toBe("");
  });

  test("로그아웃한 뒤에는 대시보드를 열 수 없다", async ({ page, signIn }) => {
    await signIn();
    await page.getByLabel("The Octocat", { exact: true }).click();
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
  });
});

test.describe("헤더 이동", () => {
  test("대시보드와 README 화면을 오갈 수 있다", async ({ page, signIn }) => {
    await signIn();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("link", { name: "README" }).click();
    await expect(page).toHaveURL(/\/export/);
    await expect(page.getByRole("link", { name: "README" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "README 내보내기" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("브랜드 링크는 로그인 상태에서 대시보드로 이어진다", async ({
    page,
    signIn,
  }) => {
    await signIn();
    await page.getByRole("link", { name: "Patchwork" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
