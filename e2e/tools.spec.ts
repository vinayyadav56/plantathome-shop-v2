import { test, expect, APIRequestContext, Locator, Page } from '@playwright/test';

/**
 * /tools — the owner's 2026-10-07 mock, on real data.
 *
 * Pins the contract, not the styling: one heading-font H1, the exact SEO title and
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
    expect((html.match(/<h1[\s>]/g) ?? []).length, 'one h1').toBe(1);
    const h1Text = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(h1Text).toBe(H1);
    const tiles = html.match(/<section[^>]*id="categories"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect((tiles.match(/href="\/c\//g) ?? []).length, 'category tiles in the server HTML').toBe(6);
    // No city on the server: when it lists tools at all, the kit band (a Tool Set) is there
    // too, linking to its PDP with a real price. City-less, so this runs in every environment.
    if (cards > 0) {
      const kit = html.match(/<section[^>]*aria-labelledby="tools-kit"[\s\S]*?<\/section>/)?.[0];
      expect(kit, 'kit band in the server HTML').toBeTruthy();
      expect(kit).toMatch(/href="\/products\/[^"]+"/);
      expect(kit).toMatch(/₹\s?\d/);
    }
    expect(html).not.toMatch(FABRICATED);
  });

  test('one H1 in the site heading font, exact title and description, Tools lit in the header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(H1);
    // The same face and weight as the other pages' headings.
    await expect.poll(() => headingFont(h1), { timeout: 15_000 }).toBe(SITE_HEADING);
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
      // Up to six: a city may list fewer tools than that.
      const n = await sellers.locator('[data-product-card]').count();
      expect(n, 'best-seller cards').toBeGreaterThanOrEqual(1);
      expect(n, 'best-seller cards').toBeLessThanOrEqual(6);
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

/* ── Tools = one seller, nationwide (plan 2026-10-08) ──────────────────────────
 * Needs the API that sends `city_based: false` on tools and skips its city gates
 * for them. The shopper's city never hides or blocks a tool: Delhi (supplied), a
 * serviceable city with no nursery supply, and no city at all all list tools; a
 * tool's CTA is never "Out of stock in {city}" (plain "Out of stock" only while
 * its seller has no rate); the PDP says it ships across India; and a tools-only
 * guest checkout takes an address in another city without a city mismatch.
 * Touches only the browser-local cart and runs checkout/verify — never places an order.
 */
const API = process.env.E2E_API_BASE || 'https://plantathome-production.up.railway.app/api';
/** Staging's serviceable cities: the first the API says has no supply is the no-supply city. */
const CANDIDATE_CITIES = ['Rewari', 'Ambala', 'Indore', 'Jaipur', 'Bengaluru', 'Mumbai', 'Gurugram'];

async function noSupplyCity(request: APIRequestContext): Promise<string | null> {
  for (const city of CANDIDATE_CITIES) {
    const r = await request.get(`${API}/city-availability`, { params: { city } });
    if (r.ok() && (await r.json())?.has_availability === false) return city;
  }
  return null;
}

/** Seeds the shopping city (or none, with the first-visit picker dismissed) before page scripts run. */
const seedCity = (city: string | null) => {
  try {
    localStorage.setItem('pah-agentation', 'off');
    if (city) localStorage.setItem('pah_customer_city', city);
    else sessionStorage.setItem('pah-city-gate-dismissed', '1');
  } catch {
    /* noop */
  }
};

/** Hydrated (the chip shows the stored city) and the city-scoped lists have landed. */
async function settled(page: Page, city: string | null) {
  if (city) {
    await expect(page.locator('[data-city-chip]:visible').first()).toHaveText(new RegExp(city), { timeout: 30_000 });
  }
  await page.waitForLoadState('networkidle');
}

/** Contact + a complete Gurugram address for the guest checkout. The guest page resets the
 *  persisted checkout on entry, so this lands after it, as a write from another tab would
 *  (jotai's atomWithStorage listens for `storage` events). */
async function seedGuestCheckout(page: Page) {
  const address = {
    title: 'Home',
    type: 'shipping',
    address: { country: 'India', state: 'Haryana', city: 'Gurugram', zip: '122001', street_address: '123 QA Street, Sector 45' },
  };
  const state = {
    billing_address: address,
    shipping_address: address,
    delivery_time: null,
    payment_gateway: 'CASH_ON_DELIVERY',
    payment_sub_gateway: '',
    customer_contact: '+919876543210',
    customer_name: 'QA Test User',
    verified_response: null,
    coupon: null,
    note: '',
    payable_amount: 0,
    use_wallet: false,
  };
  await page.evaluate((value) => {
    const key = 'plantathome-checkout';
    const json = JSON.stringify(value);
    localStorage.setItem(key, json);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: json, storageArea: localStorage }));
  }, state);
}

const toolCards = (page: Page) =>
  page.getByRole('region', { name: 'Tools gardeners love' }).locator('[data-product-card]');

test.describe('Tools are nationwide: never city-gated', () => {
  for (const kind of ['Delhi', 'a no-supply city', 'no city'] as const) {
    test(`${kind}: tools are listed, never "Out of stock in {city}", and the PDP ships across India`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      let city: string | null = kind === 'Delhi' ? 'Delhi' : null;
      if (kind === 'a no-supply city') {
        city = await noSupplyCity(request);
        test.skip(!city, 'every candidate city has nursery supply in this environment');
      }
      await page.addInitScript(seedCity, city);
      await page.goto('/tools', { waitUntil: 'domcontentloaded' });
      await settled(page, city);

      const cards = toolCards(page);
      await expect(cards.first(), 'tools listed').toBeVisible();
      await expect(cards.filter({ hasText: /Out of stock in|Not available in/i })).toHaveCount(0);
      for (let i = 0, n = await cards.count(); i < n; i++) {
        await expect(cards.nth(i)).toContainText(/Add to cart|Out of stock/i);
      }

      const href = await cards.first().locator('a[href^="/products/"]').first().getAttribute('href');
      await page.goto(href!, { waitUntil: 'domcontentloaded' });
      await settled(page, city);
      await expect(page.getByText('Ships across India').first()).toBeVisible();
      await expect(page.getByText(/Out of stock in|Not available in .+ yet|Browse-only in/i)).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^(Add to Cart|Out of Stock)$/i }).first()).toBeVisible();
    });
  }

  test('a tools-only guest checkout takes an address in another city without a mismatch', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(seedCity, 'Delhi');

    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    await settled(page, 'Delhi');
    const add = toolCards(page).getByRole('button', { name: 'Add to Cart', exact: true }).first();
    test.skip(!(await add.isVisible()), 'no tool with a seller rate to add in this environment');
    await add.click();
    const cartLines = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('plantathome-cart') ?? '{}')?.items ?? []);
    await expect.poll(async () => (await cartLines()).length).toBe(1);
    // The line carries the API's flag — without it checkout keeps the city gates.
    expect((await cartLines())[0].city_based).toBe(false);

    await page.goto('/checkout/guest', { waitUntil: 'domcontentloaded' });
    await settled(page, 'Delhi');
    await seedGuestCheckout(page);
    await expect(page.getByText('Gurugram').first()).toBeVisible();
    await expect(page.getByText(/shopping\s+in Delhi/i)).toHaveCount(0);

    const [verify] = await Promise.all([
      page.waitForResponse((r) => /\/orders\/checkout\/verify/.test(r.url()) && r.request().method() === 'POST', {
        timeout: 20_000,
      }),
      page.getByRole('button', { name: /Check Availability/i }).first().click(),
    ]);
    expect(verify.status(), 'checkout/verify').toBe(200);
    const body = await verify.json();
    expect(body.city_mismatch ?? null, 'city_mismatch').toBeNull();
    expect(body.city_stock ?? null, 'city_stock').toBeNull();
    expect(body.unavailable_products ?? [], 'unavailable_products').toEqual([]);
    await expect(page.getByText(/match your shopping city/i)).toHaveCount(0);
    await expect(page.getByText(/We don.t deliver to/i)).toHaveCount(0);
  });
});
