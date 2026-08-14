import { test as base, expect } from "@playwright/test";
import { MOCK_GITHUB_URL } from "../playwright.config";

type Fixtures = {
  /** mock GitHub의 응답 시나리오를 갈아끼운다. 테스트가 끝나면 기본값으로 돌아간다. */
  scenario: (name: string) => Promise<void>;
  /** OAuth 흐름을 실제로 타고 로그인한다. */
  signIn: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  scenario: async ({ playwright }, use) => {
    const api = await playwright.request.newContext();
    const set = async (name: string) => {
      await api.post(`${MOCK_GITHUB_URL}/__scenario`, { data: { scenario: name } });
    };

    await set("default");
    await use(set);
    await set("default");
    await api.dispose();
  },

  signIn: async ({ page }, use) => {
    await use(async () => {
      await page.goto("/");
      await page.getByRole("link", { name: "Sign in with GitHub" }).click();
      await page.waitForURL(/\/dashboard/);
    });
  },
});

export { expect };
