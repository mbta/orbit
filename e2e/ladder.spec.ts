import { test, expect } from './playwright';

test('Ladders load for logged in RL operator', async ({ page, login, duringService }) => {
    await login("user@example.com");

    await expect(page.getByText("Alewife")).toBeVisible();
    await expect(page.getByText("Savin Hill")).toBeVisible();
    await expect(page.getByText("N Quincy")).toBeVisible();

    if (duringService()) {
        const count = await page.getByTestId(/^train-pill-.+/).count();
        expect(count).toBeGreaterThan(1);
    }
});