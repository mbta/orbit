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
    const count = await page
      .getByTestId(/^ladder-branch-/)
      .getByRole("button", { name: /\d{4}/ })
      .count();
    expect(count).toBeGreaterThan(1);
  }
});

for (const [line, first, last] of [
  ["blue", "Bowdoin", "Wonderland"],
  ["orange", "Oak Grove", "Forest Hills"],
] as const) {
  test(`${line} ladder opens by direct URL and survives reload`, async ({ page, login }) => {
    await login("user@example.com");
    await page.goto(`/ladder/${line}`);
    const stations = page.getByRole("list", { name: "Stations" });
    await expect(stations).toContainText(first);
    await expect(stations).toContainText(last);
    await expect(page.getByTestId("ladder-branch-0")).toBeVisible();
    await expect(page.getByTestId("branch-picker")).toHaveCount(0);
    const rail = await stations.boundingBox();
    const viewport = page.viewportSize();
    expect(rail).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs(rail!.x + rail!.width / 2 - viewport!.width / 2)).toBeLessThan(5);
    await page.setViewportSize({ width: 320, height: 700 });
    await expect.poll(async () => {
      const box = await stations.boundingBox();
      return box ? Math.abs(box.x + box.width / 2 - 160) : Infinity;
    }).toBeLessThan(5);
    await page.reload();
    await expect(page.getByRole("list", { name: "Stations" })).toContainText(first);
  });
}

test("red ladder alias redirects to the existing shared URL", async ({ page, login }) => {
  await login("user@example.com");
  await page.goto("/ladder/red");
  await expect(page).toHaveURL(/\/ladder$/);
  await expect(page.getByRole("list", { name: "Stations" }).first()).toContainText("Alewife");
});
