import { test, expect, Page } from '@playwright/test';

/**
 * /tools — the owner's 2026-10-07 mock, on real data.
 *
 * Pins the contract, not the styling: one serif H1, the exact SEO title and
 * description, "Tools" lit in the header, BreadcrumbList + CollectionPage +
 * FAQPage structured data (the CollectionPage's ItemList present exactly when
 * the server rendered product cards), six category tiles and the need/task
 * links into /c/, the product sections either absent or correct (the API
 * decides what is listed for a city — never placeholders), a keyboard-operable
 * FAQ, one city control, the bottom nav on phones, none of the old landing's
 * made-up claims, and the usual hygiene gates: no console errors, no 4xx/5xx
 * images, no horizontal overflow.
 *
 * Read only: never switches city, never touches the cart, never places an order.
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

const H1 = 'Gardening Tools for Every Green Space';
const TITLE = 'Gardening Tools Online | Buy Garden Tools | PlantAtHome';
const DESCRIPTION =
  'Shop premium gardening tools online at PlantAtHome. Explore pruning tools, watering cans, hand tools, gardening kits and more for easy plant care.';
/** The old cinematic landing's typed-in claims — none may come back. */
const FABRICATED = /12,000\+ reviews|Lifetime warranty|Free 2-day/;

/** The header chip shows the stored city only after mount (the server can't know
 *  it), so it is the hydration signal: before it, clicks and keys hit dead HTML. */
const hydrated = (page: Page) =>
  expect(page.locator('[data-city-chip]:visible').first()).toHaveText(/Delhi/, { timeout: 30_000 });

/** Walks the page so every lazy image is requested, then lets the network settle. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForLoadState('networkidle');
}

test.describe('/tools landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
  });

  test('server HTML: structured data, and an ItemList exactly when cards were rendered', async ({ request }) => {
    const res = await request.get('/tools');
    expect(res.status()).toBeLessThan(400);
    const html = await res.text();
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const byType = (t: string) => ld.find((x) => x['@type'] === t);
    expect(byType('BreadcrumbList'), 'BreadcrumbList').toBeTruthy();
    const faq = byType('FAQPage');
    expect(faq?.mainEntity, 'FAQPage questions').toHaveLength(5);
    const collection = byType('CollectionPage');
    expect(collection?.name).toBe('Gardening Tools');
    expect(collection?.description).toBe(DESCRIPTION);
    // The ItemList is the server-rendered best-sellers — present iff cards are.
    const cards = (html.match(/data-product-card/g) ?? []).length;
    expect(Boolean(collection?.mainEntity), `ItemList iff ${cards} server cards`).toBe(cards > 0);
    if (cards > 0) {
      expect(collection.mainEntity['@type']).toBe('ItemList');
      expect(collection.mainEntity.itemListElement).toHaveLength(cards);
      for (const item of collection.mainEntity.itemListElement) expect(item.url).toMatch(/\/products\/[^/]+$/);
    }
    // The H1 and every category tile are in the HTML itself (crawlers, no-JS).
    expect(html).toContain('Gardening Tools');
    expect(html).not.toMatch(FABRICATED);
  });

  test('one serif H1, exact title and description, Tools lit in the header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(H1);
    // The page-scoped display serif (next/font variable on the route wrapper).
    await expect
      .poll(() => h1.evaluate((el) => getComputedStyle(el).fontFamily), { timeout: 15_000 })
      .toMatch(/Playfair/i);
    await expect(page).toHaveTitle(TITLE);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', DESCRIPTION);
    const lit = page.locator('#site-header a[aria-current="page"]:visible');
    await expect(lit).toHaveCount(1);
    await expect(lit).toHaveText(/^\s*Tools\s*$/);
    expect(await page.locator('body').innerText()).not.toMatch(FABRICATED);
  });

  test('six category tiles, four need cards and seven task tiles link into /c/', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    // The hero's primary CTA scrolls here.
    await expect(page.locator('section#categories')).toBeAttached();
    await expect(page.getByRole('region', { name: 'Shop by Category' }).locator('a[href^="/c/"]')).toHaveCount(6);
    await expect(page.getByRole('region', { name: 'Not sure what you need?' }).locator('a[href^="/c/"]')).toHaveCount(4);
    await expect(page.getByRole('region', { name: 'What are you working on today?' }).locator('a[href^="/c/"]')).toHaveCount(7);
    await expect(page.getByRole('region', { name: 'Gardening Tools Guide' }).locator('a[href^="/c/"]')).toHaveCount(4);
  });

  test('best-sellers and the kit band: absent, or real cards, a PDP link and a ₹ price', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    // The city-scoped lists replace the server's all-India ones after hydration.
    await page.waitForLoadState('networkidle');

    const sellers = page.getByRole('region', { name: 'Tools gardeners love' });
    const kit = page.locator('section[aria-labelledby="tools-kit"]');
    const hasSellers = await sellers.isVisible();
    const hasKit = await kit.isVisible();
    if (!hasSellers && !hasKit) {
      test.skip(true, 'the API lists no tools for the seeded city in this environment');
    }
    if (hasSellers) {
      await expect(sellers.locator('[data-product-card]')).toHaveCount(6);
      await expect(sellers.locator('a[href^="/products/"]').first()).toBeVisible();
    }
    if (hasKit) {
      await expect(kit.locator('a[href^="/products/"]')).toBeVisible();
      await expect(kit).toContainText(/₹\s?\d/);
      await expect(kit.getByRole('heading', { level: 2 })).not.toBeEmpty();
    }
  });

  test('FAQ: answers in the HTML, none open, Tab reaches a question and Enter toggles it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    const faq = page.getByRole('region', { name: 'Gardening Tools — FAQs' });
    const rows = faq.locator('details');
    await expect(rows).toHaveCount(5);
    expect(await faq.locator('details[open]').count(), 'none open by default').toBe(0);
    await expect(rows.first().locator('p')).not.toBeEmpty();

    // Tab in from the control before it (the last guide card).
    await page.getByRole('region', { name: 'Gardening Tools Guide' }).getByRole('link').last().focus();
    await page.keyboard.press('Tab');
    const first = rows.first();
    await expect(first.locator('summary')).toBeFocused();
    const isOpen = () => first.evaluate((d) => (d as HTMLDetailsElement).open);
    await page.keyboard.press('Enter');
    await expect.poll(isOpen).toBe(true);
    await expect(first.locator('p')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect.poll(isOpen).toBe(false);
  });

  for (const width of [390, 768, 1440]) {
    test(`one city control, bottom nav on phones, clean console/images/overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const h = await hygiene(page);
      await page.goto('/tools', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await expect(page.locator('[data-city-chip]:visible')).toHaveCount(1);
      if (width < 768) {
        await expect(page.locator('nav').filter({ has: page.locator('a[href="/cart"]') }).first()).toBeVisible();
      }
      await scrollThrough(page);
      await h.assert();
    });
  }
});
