import { expect, test } from "./playwright";

test("Ladders load for logged in RL operator", async ({
  page,
  login,
  duringService,
}) => {
  await login("user@example.com");

  await expect(
    page.getByTestId("ladder-branch-0").getByText("Alewife"),
  ).toBeVisible();
  await expect(
    page.getByTestId("ladder-branch-1").getByText("Savin Hill"),
  ).toBeVisible();
  await expect(
    page.getByTestId("ladder-branch-2").getByText("N Quincy"),
  ).toBeVisible();

  if (duringService()) {
    const count = await page.getByTestId(/^train-pill-.+/).count();
    expect(count).toBeGreaterThan(1);
  }
});
