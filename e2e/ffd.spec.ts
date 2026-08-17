import { ORBIT_BL_FFD } from '../js/groups';
import { getNow } from '../js/now';
import { test, expect } from './playwright';

test('navigates Blue Line ffd user to fit for duty page', async ({ page, login, duringService }) => {
    await login("user@example.com", ORBIT_BL_FFD);

    await expect(page).toHaveURL(new URLPattern({ pathname: '/operators' }));
    await expect(page.getByText("Search and sign in operators")).toBeVisible();
});

test('service date populated in sign in records field', async ({ page, login, duringService }) => {
    await login("user@example.com", ORBIT_BL_FFD);

    const now = getNow()?.toISODate();
    if (duringService() && !!now) {
        await expect(page.getByLabel("Service Date")).toHaveValue(now);
    }
});

test('ffd flow works for existing user', async ( { page, login }) => {
    await login("user@example.com", ORBIT_BL_FFD);

    await page.getByRole("button", { name: "Sign In Operator"}).click();
    
    await page.getByLabel("Search for an Operator").fill("TEST_BADGE");
    await page.getByRole("button", {name: "OK"}).click();
    
    await page.getByRole("button", { name: "Continue to Fit for Duty Check →"}).click();
    
    await page.getByLabel("Operator Badge Number").fill("TEST_BADGE");
    await page.getByLabel("Radio Number").fill("NA");
    await page.getByRole("button", {name: "Complete Fit for Duty Check"}).click();
    
    await expect(page.getByText("Test Signed in Successfully")).toBeVisible();
});