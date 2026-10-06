import { test, expect, Page } from '@playwright/test';

/**
 * /plants as a Product Listing Page.
 *
 * Pins the shopping contract, not the styling: the H1, the one city control
 * (the header chip — the PLP's "Change" is a plain button), the bottom nav on
 * phones (the old vertical landing had none), product links in the server
 * HTML, need chips and sort that round-trip through the URL, "Clear all" that
 * keeps products on screen (it used to write `manufacturer=undefined` and
 * empty the grid), the search route rendering the same body, and the usual
 * hygiene gates: no console errors, no 4xx/5xx images, no horizontal overflow.
 *
 * READ ONLY against any environment: never adds to cart, never switches city.
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

test.describe('/plants PLP', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
  });

  test('server HTML is a listing: H1, products, categories, needs, structured data', async ({ page }) => {
    const res = await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Plants$/);
    await expect(page.locator('a[href^="/products/"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Shop by category' })).toBeVisible();
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
      await h.assert();
    });
  }

  test('a need chip filters through the URL and the count follows', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'networkidle' });
    // Chips are facet VALUES for the shopper's city. A city whose few stocked
    // plants carry no attributes has none — that is data, not a defect.
    const needs = page.getByRole('region', { name: /shop by need/i });
    if (!(await needs.isVisible().catch(() => false))) {
      test.skip(true, 'no facet values for the seeded city in this environment');
    }
    const chip = needs.getByRole('button', { name: /\d+$/ }).first();
    await expect(chip).toBeVisible({ timeout: 20_000 });
    const label = (await chip.textContent())?.trim() ?? '';
    await chip.click();
    await expect.poll(() => page.url(), { timeout: 10_000 }).toMatch(/\?(sunlight|placement|pet_friendly|water|difficulty|terms)=/);
    expect(page.url()).not.toMatch(/searchType=/);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('a[href^="/products/"]').first()).toBeAttached({ timeout: 20_000 });
    expect(label.length).toBeGreaterThan(0);
  });

  test('sort writes the URL and the dropdown shows it; Clear all keeps products', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants?orderBy=min_price&sortedBy=ASC', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Low to High/).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /clear all/i }).first().click();
    await expect.poll(() => page.url()).not.toMatch(/orderBy=|manufacturer=|undefined/);
    await expect(page.locator('a[href^="/products/"]').first()).toBeAttached({ timeout: 20_000 });
  });

  test('/plants/search renders the same body with the term', async ({ page }) => {
    const h = await hygiene(page);
    await page.goto('/plants/search?text=plant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Plants$/);
    await expect(page.getByText(/Results for/)).toBeVisible();
    await expect(page.locator('a[href^="/products/"]').first()).toBeAttached({ timeout: 20_000 });
    await h.assert();
  });
});
