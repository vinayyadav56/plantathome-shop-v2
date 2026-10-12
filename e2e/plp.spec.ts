import { test, expect, Locator, Page } from '@playwright/test';

/**
 * /plants as a Product Listing Page (the 2026-10-07 design).
 *
 * Pins the shopping contract, not the styling: the heading-font H1, the one city
 * control (the header chip — no in-page city selector), the bottom nav on
 * phones, product links in the server HTML, a real "N+ plants" trust
 * count, category tiles linking /c/, need tiles and sort that round-trip
 * through the URL, "Popular" as the default sort, the site's one product card
 * (the /c card) — a click anywhere on it opens the product, in a new tab on
 * desktop and the same tab on a phone, while a simple product's Add To Shopping
 * Cart still adds in place (bumps the header badge — local state only, no
 * order) — "Clear all" that
 * keeps products on screen, /c's five grid columns at 1536, the search route
 * rendering the same body, and the usual
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

/** The header chip shows the stored city only after mount (the server can't know
 *  it), so it is the hydration signal: before it, clicks hit dead HTML. */
const hydrated = (page: Page) =>
  expect(page.locator('[data-city-chip]:visible').first()).toHaveText(/Delhi/, { timeout: 30_000 });

/** The H1 must use the site heading font: whatever `font-heading` resolves to
 *  (admin Design System), never a page-scoped face, at the storefront heading
 *  weight. Polled, because the admin font vars land after hydration. */
const SITE_HEADING = 'site heading font @ 500';
const headingFont = (el: Locator) =>
  el.evaluate((node) => {
    const probe = document.body.appendChild(document.createElement('span'));
    probe.className = 'font-heading';
    const site = getComputedStyle(probe).fontFamily;
    probe.remove();
    const { fontFamily, fontWeight } = getComputedStyle(node);
    return `${fontFamily === site ? 'site heading font' : fontFamily} @ ${fontWeight}`;
  });

test.describe('/plants PLP', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
  });

  test('server HTML is a listing: H1 in the site heading font, trust count, products, categories, structured data', async ({ page }) => {
    const res = await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/^Plants$/);
    // The same face and weight as the other pages' headings.
    await expect.poll(() => headingFont(h1), { timeout: 15_000 }).toBe(SITE_HEADING);
    // "N+ plants" is the real catalogue total rounded down — never typed in.
    await expect(page.getByText(/\d[\d,]*\+ plants/).first()).toBeVisible();
    await expect(firstProductLink(page)).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Shop by Category' })).toBeVisible();
    // Photo tiles linking /c/, the category name written on each (its link text).
    const tile = page.getByRole('region', { name: 'Shop by Category' }).locator('a[href^="/c/"]').first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveText(/\S/);
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
      // The header chip is the only city control: no in-page "Delivering to … ·
      // Change" selector. Checked after hydration, when it would have rendered.
      await hydrated(page);
      await expect(page.getByRole('button', { name: /change delivery city|select delivery city/i })).toHaveCount(0);
      if (width < 768) {
        await expect(page.locator('nav').filter({ has: page.locator('a[href="/cart"]') }).first()).toBeVisible();
      }
      await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
      await h.assert();
    });
  }

  test('results row, Popular by default, the /c column ladder (five at 1536)', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/\d[\d,]* Plants available/).first()).toBeVisible({ timeout: 20_000 });
    // No ?orderBy in the URL ⇒ the dropdown reads the page default, Popular
    // (the select renders a placeholder until it mounts).
    await expect(page.getByText(/^Popular$/).first()).toBeVisible({ timeout: 20_000 });
    await expect(firstProductLink(page)).toBeAttached({ timeout: 20_000 });
    const tracks = await page
      .locator('[data-product-card]')
      .first()
      .evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length);
    expect(tracks, 'grid columns at 1536px').toBe(5);
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

  /** Click the middle of a card's description — a spot with no control of its own, so
   *  whatever happens there is the card's stretched link. A real mouse click (not
   *  locator.click) because the link's overlay is meant to sit over the text. */
  const clickCardBody = async (page: Page, card: Locator) => {
    const desc = card.locator('p').last();
    await desc.scrollIntoViewIfNeeded();
    const box = await desc.boundingBox();
    if (!box) throw new Error('card description not laid out');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };

  test('every card has a CTA; on desktop a click anywhere on a card opens the product in a new tab', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[data-product-card]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    // The new-tab target is set after mount; wait for hydration and the city-scoped list.
    await hydrated(page);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

    const n = await cards.count();
    for (let i = 0; i < Math.min(n, 12); i++) {
      // Sized products go to the product page to choose ("Select Options" is a link —
      // the in-card size picker is gone); simple ones add in place.
      await expect(
        cards
          .nth(i)
          .getByRole('link', { name: /^select options$/i })
          .or(cards.nth(i).getByRole('button', { name: /add to shopping cart|out of stock/i })),
      ).toBeVisible();
    }

    const card = cards.first();
    const link = card.locator('a[href^="/products/"]').first();
    await expect(link).toHaveAttribute('target', '_blank');
    const href = await link.getAttribute('href');
    const [tab] = await Promise.all([context.waitForEvent('page'), clickCardBody(page, card)]);
    await tab.waitForLoadState('domcontentloaded');
    expect(new URL(tab.url()).pathname).toBe(href);
    await tab.close();
    // The listing stays where it was, with no size sheet opened over it.
    expect(new URL(page.url()).pathname).toBe('/plants');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('on a phone a click anywhere on a card opens the product in the same tab', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-product-card]').first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    await hydrated(page);
    // The city-scoped list replaces the server one; measure the card only once it has.
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });
    const link = card.locator('a[href^="/products/"]').first();
    await expect(link).not.toHaveAttribute('target', /.+/);
    const href = await link.getAttribute('href');
    const pagesBefore = context.pages().length;
    await clickCardBody(page, card);
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 20_000 }).toBe(href);
    expect(context.pages().length).toBe(pagesBefore);
  });

  test("a simple product's Add To Shopping Cart adds in place — the card's link doesn't take the click", async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[data-product-card]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    await hydrated(page);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

    const addable = cards.filter({ has: page.getByRole('button', { name: /add to shopping cart/i }) });
    if ((await addable.count()) === 0) {
      test.skip(true, 'no simple product addable in the seeded city in this environment');
    }
    const badge = page.locator('[data-cart-target] span span');
    const before = Number((await badge.first().textContent())?.trim() || '0');
    const pagesBefore = context.pages().length;
    await addable.first().getByRole('button', { name: /add to shopping cart/i }).click();
    await expect.poll(async () => Number((await badge.first().textContent())?.trim() || '0'), { timeout: 10_000 }).toBe(before + 1);
    expect(new URL(page.url()).pathname).toBe('/plants');
    expect(context.pages().length).toBe(pagesBefore);
  });

  test('the search box beside Shop by Need searches plants', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    const box = page.getByRole('textbox', { name: 'Search Plants' });
    await box.fill('snake');
    await box.press('Enter');
    await expect(page).toHaveURL(/\/plants\/search\?text=snake$/);
    await expect(page.getByText(/Results for/).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search Plants' })).toHaveValue('snake');
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
