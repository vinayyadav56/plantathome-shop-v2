import { test, expect, Page } from '@playwright/test';

/**
 * /plants as a Product Listing Page (the 2026-10-07 design).
 *
 * Pins the shopping contract, not the styling: the serif H1, the one city
 * control (the header chip — the PLP's "Change" is a plain button), the bottom
 * nav on phones, product links in the server HTML, a real "N+ plants" trust
 * count, category tiles linking /c/, need tiles and sort that round-trip
 * through the URL, "Popular" as the default sort, "Add to cart" on every card
 * opening the size sheet (adding a size bumps the header cart badge — local
 * state only, no order), "Clear all" that keeps products on screen, six grid
 * columns at 1536, the search route rendering the same body, and the usual
 * hygiene gates: no console errors, no 4xx/5xx images, no horizontal overflow.
 *
 * Read-only against any environment except the cart test, which only touches
 * the browser-local cart. Never switches city, never places an order.
 */

const SEED_CITY = () => {
  try {
    localStorage.setItem('pah_customer_city', 'Delhi');
    localStorage.setItem('pah-agentation', 'off');
  } catch {
    /* noop */
  }
};

async function hygiene(page: Page) {
  const consoleErrors: string[] = [];
  const badImages: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // The dead Unsplash category photo (staging data) also logs a resource 404.
    if (/unsplash\.com/.test(decodeURIComponent(m.location()?.url ?? ''))) return;
    consoleErrors.push(m.text());
  });
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] ?? '';
    // Staging's category records point at a long-dead Unsplash photo (data the
    // admin replaces); a tile asking for it is not a code defect.
    if (r.status() >= 400 && (ct.startsWith('image/') || /\/_next\/image/.test(r.url())) && !/unsplash\.com/.test(decodeURIComponent(r.url()))) {
      badImages.push(`${r.status()} ${r.url()}`);
    }
  });
  return {
    assert: async () => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1);
      expect(badImages, 'image responses ≥ 400').toEqual([]);
      expect(consoleErrors.filter((e) => !/Agentation|third-party|ERR_BLOCKED_BY_CLIENT/i.test(e)), 'console errors').toEqual([]);
    },
  };
}

const firstProductLink = (page: Page) => page.locator('a[href^="/products/"]').first();

test.describe('/plants PLP', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
  });

  test('server HTML is a listing: serif H1, trust count, products, categories, structured data', async ({ page }) => {
    const res = await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/^Plants$/);
    // The page-scoped display serif (next/font variable on the route wrapper).
    await expect
      .poll(() => h1.evaluate((el) => getComputedStyle(el).fontFamily), { timeout: 15_000 })
      .toMatch(/Playfair/i);
    // "N+ plants" is the real catalogue total rounded down — never typed in.
    await expect(page.getByText(/\d[\d,]*\+ plants/).first()).toBeVisible();
    await expect(firstProductLink(page)).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Shop by Category' })).toBeVisible();
    await expect(page.locator('a[href^="/c/"]').first()).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"ItemList"'))).toBe(true);
    expect(ld.some((t) => t.includes('"BreadcrumbList"'))).toBe(true);
  });

  for (const width of [390, 768, 1440]) {
    test(`one city control and a bottom nav where expected at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const h = await hygiene(page);
      await page.goto('/plants', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-city-chip]:visible')).toHaveCount(1);
      // The PLP's own "Change" opens the same picker but is NOT a second chip.
      await expect(page.getByRole('button', { name: /change delivery city|select delivery city/i })).toBeVisible();
      if (width < 768) {
        await expect(page.locator('nav').filter({ has: page.locator('a[href="/cart"]') }).first()).toBeVisible();
      }
      await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
      await h.assert();
    });
  }

  test('results row, Popular by default, six columns at 1536', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/\d[\d,]* Plants available/).first()).toBeVisible({ timeout: 20_000 });
    // No ?orderBy in the URL ⇒ the dropdown reads the page default, Popular.
    await expect(page.getByText(/^Popular$/).first()).toBeVisible();
    await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
    const tracks = await page
      .locator('[data-product-card]')
      .first()
      .evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length);
    expect(tracks, 'grid columns at 1536px').toBe(6);
  });

  test('a need tile filters through the URL and marks itself pressed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'networkidle' });
    // Tiles are the admin's collections, shown only when the facets prove a
    // match for the shopper's city. A city whose few stocked plants carry no
    // attributes has none — that is data, not a defect.
    const needs = page.getByRole('region', { name: /shop by need/i });
    if (!(await needs.isVisible().catch(() => false))) {
      test.skip(true, 'no collection matches the seeded city in this environment');
    }
    const tile = needs.getByRole('button').first();
    await expect(tile).toBeVisible({ timeout: 20_000 });
    const label = (await tile.textContent())?.trim() ?? '';
    await tile.click();
    await expect
      .poll(() => page.url(), { timeout: 10_000 })
      .toMatch(/\?(sunlight|placement|pet_friendly|air_purifying|water|difficulty|terms|category)=/);
    expect(page.url()).not.toMatch(/searchType=/);
    await expect(tile).toHaveAttribute('aria-pressed', 'true');
    await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
    expect(label.length).toBeGreaterThan(0);
  });

  test('sort writes the URL and the dropdown shows it; Clear all keeps products', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants?orderBy=min_price&sortedBy=ASC', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Low to High/).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /clear all/i }).first().click();
    await expect.poll(() => page.url()).not.toMatch(/orderBy=|manufacturer=|undefined/);
    await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
  });

  test('every card has Add to cart; the size sheet adds a sized plant to the local cart', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[data-product-card]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    // Wait for the city-scoped list (the dimmed "Updating for Delhi…" state) to settle.
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

    const n = await cards.count();
    for (let i = 0; i < Math.min(n, 12); i++) {
      await expect(cards.nth(i).getByRole('button', { name: /add to cart|out of stock/i })).toBeVisible();
    }

    const badge = page.locator('[data-cart-target] span span');
    const before = Number((await badge.first().textContent())?.trim() || '0');

    const addable = cards.filter({ has: page.getByRole('button', { name: /^add to cart$/i }) });
    if ((await addable.count()) === 0) {
      test.skip(true, 'nothing addable in the seeded city in this environment');
    }
    await addable.first().getByRole('button', { name: /^add to cart$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const chips = dialog.locator('button[aria-pressed]');
    await expect(chips.first()).toBeVisible({ timeout: 20_000 });
    // Escape closes the sheet; reopen it for the add.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await addable.first().getByRole('button', { name: /^add to cart$/i }).click();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await chips.first().click();
    const add = dialog.getByRole('button', { name: /^add to cart$/i });
    await expect(add).toBeEnabled({ timeout: 10_000 });
    await add.click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect.poll(async () => Number((await badge.first().textContent())?.trim() || '0'), { timeout: 10_000 }).toBe(before + 1);
  });

  test('/plants/search renders the same body with the term', async ({ page }) => {
    const h = await hygiene(page);
    await page.goto('/plants/search?text=plant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Plants$/);
    await expect(page.getByText(/Results for/).first()).toBeVisible();
    await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
    await h.assert();
  });
});
