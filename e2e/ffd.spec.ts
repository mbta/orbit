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