import { test, expect } from './playwright';

test('shows Orbit title after login', async ({ page, login }) => {
  await login("user@example.com");

  // Expect the landing page to load.
  await expect(page).toHaveTitle(/Orbit/);
});

test('RL inspector is redirected to ladder after login', async ({ page, login }) => {
  await login("user@example.com");

  await expect(page).toHaveURL(new URLPattern({ pathname: '/ladder' }));
});

test('Orbit tid staff is redirected to landing page', async ({ page, login }) => {
  await login("user@example.com", "orbit-tid-staff");

  await expect(page).toHaveURL(new URLPattern({ pathname: '/landing' }));
});

test('Log out', async ({ page, login, logout }) => {
  await login("user@example.com");
  await logout();

  await expect(page).toHaveURL(new URLPattern({ pathname: '/logout' }));
  await expect(page.getByText("Logged out.")).toBeVisible();
});