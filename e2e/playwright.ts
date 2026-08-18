import { test as baseTest } from "@playwright/test";
import { getNow } from "../js/now";
import { ORBIT_RL_INSPECTORS } from "../js/groups";

/* eslint-disable react-hooks/rules-of-hooks -- playwright conventionally calls their callback `use` which incorrectly triggers the react rules of hooks checks */

export * from "@playwright/test";
export const test = baseTest.extend<{
  login: (email: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  duringService: () => boolean;
}>({
  login: async ({ page }, use) => {
    await use(async (email, role = ORBIT_RL_INSPECTORS) => {
      if (!page.url().endsWith("/auth/keycloak")) {
        await page.goto("/auth/keycloak");
      }
      await page.getByLabel("Email:").fill(email);
      await page.getByLabel(role).check();
      await page.getByRole("button", { name: "Log in" }).click();
    });
  },

  logout: async ({ page }, use) => {
    await use(async () => {
      if (!page.url().endsWith("/menu")) {
        await page.goto("/menu");
      }
      await page.getByRole("link", { name: "Logout" }).click();
    });
  },

  /**
   * Do we expect there to be trains in the realtime data?
   * Prevents spurious test failures due to empty data in the middle of the night, when there are no trains.
   * Says service ends at midnight and starts at 6am, which is erring on the side of allowing empty data.
   */
  // eslint-disable-next-line no-empty-pattern -- required by Playwright
  duringService: async ({}, use) => {
    await use((): boolean => {
      const now = getNow();
      return now.hour > 5;
    });
  },
});
