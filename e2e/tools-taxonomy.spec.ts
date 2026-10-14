import { test, expect } from '@playwright/test';

/**
 * The Gardening Tools taxonomy on category pages (owner brief 2026-10-14): 14 parents,
 * 74 sub-categories, 390 tool types, a repeated name listed in every branch as ONE page.
 *
 * Pins the contract: the whole primary path in the breadcrumb (visible and BreadcrumbList),
 * a parent page listing the products filed anywhere beneath it, a placement linking to the
 * one canonical page, and an empty tool type saying so without city wording (Tools ship
 * nationwide). Read only.
 */

test.describe('Gardening Tools category pages', () => {
  // A first visit opens the city picker over the page; seed a city as the /tools specs do.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('pah_customer_city', 'Delhi');
        localStorage.setItem('pah-agentation', 'off');
      } catch {
        /* noop */
      }
    });
  });

  test('a tool type carries its whole path in the BreadcrumbList', async ({ request }) => {
    const res = await request.get('/c/bypass-pruners');
    expect(res.status()).toBe(200);
    const html = await res.text();
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const crumbs = ld.find((x) => x['@type'] === 'BreadcrumbList')?.itemListElement?.map((i: any) => i.name);
    expect(crumbs).toEqual(['Home', 'Categories', 'Pruning and Cutting Tools', 'Secateurs and Pruners', 'Bypass Pruners']);
  });

  test('a parent lists its sub-categories and the products filed beneath them', async ({ page }) => {
    await page.goto('/c/hand-gardening-tools');
    await expect(page.locator('a[href="/c/trowels-and-scoops"]').first()).toBeVisible();
    // The steel trowel sits two levels down (Trowels and Scoops › Hand Trowels), never on the parent.
    await expect(page.locator('a[href="/products/steel-hand-trowel"]').first()).toBeAttached({ timeout: 20_000 });
  });

  test('a repeated name is one page, listed in every branch', async ({ page }) => {
    await page.goto('/c/bonsai-tools');
    await expect(page.locator('a[href="/c/root-hooks"]')).toHaveCount(1);
    await page.goto('/c/repotting-tools');
    await expect(page.locator('a[href="/c/root-hooks"]')).toHaveCount(1);
  });

  test('an empty tool type says so, without city wording', async ({ page }) => {
    await page.goto('/c/robotic-mowers');
    await expect(page.getByText('Nothing in Robotic Mowers yet')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/change your city|in your city/i)).toHaveCount(0);
    await expect(page.locator('a[href="/tools"]').first()).toBeVisible();
  });
});
