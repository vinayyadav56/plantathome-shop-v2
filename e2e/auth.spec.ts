import { test, expect } from '@playwright/test';

// Storefront auth + account guard spec (staging shop).
// Shop authenticates against the legacy /api (railway staging).
// A pre-seeded throwaway customer is expected; override via env.
const BASE = process.env.SHOP_BASE ?? 'https://plantathome-shop-staging.vercel.app';
// Seeded 2026-07-27 via /api/register on staging (the old customer@… account's
// password no longer matches).
const EMAIL = process.env.QA_EMAIL ?? 'qa-customer-e2e@plantathome.test';
const PASSWORD = process.env.QA_PASSWORD ?? 'Passw0rd!';

// Pre-seed the shopping city everywhere: the blocking first-visit city dialog
// otherwise sits over the page and intercepts every Login click. Its own
// behaviour is covered in the golden-path spec. Also switch OFF the staging
// Agentation toolbar — it is default-on for humans, but its localhost:4747
// polls log CORS console errors that would poison assertions.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pah_customer_city', 'Delhi');
    localStorage.setItem('pah-agentation', 'off');
  });
});

test.describe('storefront auth', () => {
  test('signin page renders login + register forms', async ({ page }) => {
    await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[type=email]').first()).toBeVisible();
    await expect(page.locator('input[type=password]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /register/i }).first()).toBeVisible();
  });

  test('empty submit triggers client validation', async ({ page }) => {
    await page.goto(`${BASE}/signin`, { waitUntil: 'load' });
    const login = page.getByRole('button', { name: /^login$/i }).first();
    await login.click().catch(() => {});
    await page.waitForTimeout(800);
    // A click that lands before hydration is silently swallowed (no handler
    // wired yet) — retry once instead of failing on framework timing.
    const body = (await page.locator('body').textContent()) ?? '';
    if (!/required|enter|invalid|must/i.test(body)) {
      await login.click().catch(() => {});
      await page.waitForTimeout(800);
    }
    await expect(page.locator('body')).toContainText(/required|enter|invalid|must/i);
  });

  test('wrong credentials shows an error and stays on /signin', async ({ page }) => {
    await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type=email]').first().fill(EMAIL);
    await page.locator('input[type=password]').first().fill('definitely-wrong-pw');
    await page.getByRole('button', { name: /^login$/i }).first().click();
    await page.waitForTimeout(2500);
    expect(page.url()).toContain('/signin');
    await expect(page.locator('body')).toContainText(/wrong|incorrect|credential|invalid|not match/i);
  });

  test('successful login sets auth_token cookie and can reach /profile', async ({ page, context }) => {
    await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type=email]').first().fill(EMAIL);
    await page.locator('input[type=password]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /^login$/i }).first().click();
    await page.waitForTimeout(3500);
    const cookie = (await context.cookies()).find((c) => c.name === 'auth_token');
    expect(cookie, 'auth_token cookie should be set after login').toBeTruthy();

    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const values = await page.$$eval('input', (els) => els.map((e) => (e as HTMLInputElement).value).filter(Boolean));
    expect(values.join(' ')).toContain('@');
  });
});

test.describe('protected-route guard (guest)', () => {
  for (const path of ['/profile', '/orders', '/wishlists', '/change-password', '/orders/SOMERANDOM123']) {
    test(`guest ${path} is gated with a login form`, async ({ page }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      // PrivateRoute renders LoginView in place (URL is not redirected to /signin).
      await expect(page.locator('input[type=password]').first()).toBeVisible();
      await expect(page.locator('body')).toContainText(/login|sign in|password/i);
    });
  }
});
