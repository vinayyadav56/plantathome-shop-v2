import { test, expect, Locator, Page } from '@playwright/test';

/**
 * /farmbox — the owner's 2026-10-09 mock, on real data.
 *
 * Pins the contract, not the styling: one H1 in the site heading font (only the two handwritten
 * notes use the script face), the exact SEO title and description, "FarmBox" lit in the header,
 * BreadcrumbList + CollectionPage structured data (its ItemList present exactly when the server
 * rendered product cards), the four section headings, real category links into /c/, the combos
 * either real cards or the empty state (never placeholders), the anchors the CTAs point at, one
 * city control, none of the old landing's made-up claims, and the usual hygiene gates.
 *
 * The combos' card, empty and error states are also driven with an intercepted product list,
 * because no FarmBox product is listed in any environment yet (2026-10-09).
 *
 * Read only: never switches city or places an order. One test adds a stand-in product to the
 * browser-local cart.
 */

const API = process.env.E2E_API_BASE || 'https://plantathome-production.up.railway.app/api';

/** Staging calls the vertical `farmbox`, production `farm-box`; set from whichever is served. */
let SLUG = 'farmbox';

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
    // Category photos are admin data on Unsplash; a dead one is not a code defect.
    if (/unsplash\.com/.test(decodeURIComponent(m.location()?.url ?? ''))) return;
    consoleErrors.push(m.text());
  });
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] ?? '';
    if (
      r.status() >= 400 &&
      (ct.startsWith('image/') || /\/_next\/image/.test(r.url())) &&
      !/unsplash\.com/.test(decodeURIComponent(r.url()))
    ) {
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
      expect(
        consoleErrors.filter((e) => !/Agentation|third-party|ERR_BLOCKED_BY_CLIENT/i.test(e)),
        'console errors',
      ).toEqual([]);
    },
  };
}

const H1 = 'Fresh, Natural Goodness at Your Doorstep';
const TITLE = 'Fresh FarmBox Fruits & Vegetables Delivered | PlantAtHome';
const DESCRIPTION =
  'Shop fresh fruits, vegetables, greens and curated FarmBox combos sourced from trusted farms and delivered fresh to your doorstep.';
const H2S = ['Shop by Category', 'Seasonal Freshness in Every Box', 'Our FarmBox Combos', 'From Farm to Your Home'];
/** The old cinematic landing's typed-in claims, and the sourcing button the owner hid. Checked
 *  inside <main> only: the site footer carries its own badges. */
const FORBIDDEN = /12k\+|12,000\+|4\.9 \/ 5|certified organic|Harvested at dawn|30-day|Our Sourcing Process/i;
const EMPTY = 'No FarmBox selections available right now.';
const ERROR = 'Something went wrong while loading FarmBox.';

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

/** The header chip shows the stored city only after mount, so it is the hydration signal. */
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

const textOf = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** FarmBox switched to COMING SOON (GET /types still lists it): its landing is the Coming Soon
 *  page, covered by the /tools spec's Coming Soon suite; nothing here applies, so it skips. */
let FARMBOX_SOON = false;

test.beforeAll(async ({ request }) => {
  SLUG = (await request.get('/farmbox')).status() === 404 ? 'farm-box' : 'farmbox';
  const r = await request.get(`${API}/types`, { params: { limit: 100, language: 'en' } });
  const body = r.ok() ? await r.json() : [];
  FARMBOX_SOON = ((Array.isArray(body) ? body : body?.data ?? []) as { slug?: string; availability?: { status?: string } | null }[]).some(
    (t) => (t?.slug === 'farmbox' || t?.slug === 'farm-box') && t?.availability?.status === 'coming_soon',
  );
});

test.beforeEach(() => {
  test.skip(FARMBOX_SOON, 'FarmBox is Coming Soon in this environment');
});

test.describe('/farmbox landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
  });

  test('server HTML: one H1, the four H2s, category links, structured data, no invented claims', async ({ request }) => {
    const res = await request.get(`/${SLUG}`);
    expect(res.status()).toBe(200);
    const html = await res.text();

    expect((html.match(/<h1[\s>]/g) ?? []).length, 'one h1').toBe(1);
    expect(textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')).toBe(H1);
    const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => textOf(m[1]));
    for (const h of H2S) expect(h2s, `h2 "${h}"`).toContain(h);

    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const byType = (t: string) => ld.find((x) => x['@type'] === t);
    expect(byType('BreadcrumbList'), 'BreadcrumbList').toBeTruthy();
    const collection = byType('CollectionPage');
    expect(collection?.description).toBe(DESCRIPTION);
    // The ItemList is the server-rendered combos — present iff cards are.
    const cards = (html.match(/data-product-card/g) ?? []).length;
    expect(Boolean(collection?.mainEntity), `ItemList iff ${cards} server cards`).toBe(cards > 0);

    // Whatever categories the API has are in the HTML itself (both environments have some).
    const cats = html.match(/<section[^>]*id="categories"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect((cats.match(/href="\/c\//g) ?? []).length, 'category links in the server HTML').toBeGreaterThan(0);

    const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
    expect(main, '<main> in the server HTML').not.toBe('');
    expect(textOf(main)).not.toMatch(FORBIDDEN);
  });

  test('H1 in the site heading font, exact title and description, FarmBox lit, notes in the script face', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(H1);
    await expect.poll(() => headingFont(h1), { timeout: 15_000 }).toBe(SITE_HEADING);
    await expect(page).toHaveTitle(TITLE);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', DESCRIPTION);
    const lit = page.locator('#site-header a[aria-current="page"]:visible');
    await expect(lit).toHaveCount(1);
    await expect(lit).toHaveText(/^\s*FarmBox\s*$/);

    // The handwritten notes, and only they, use the page's script face.
    for (const note of ['From Our Farms', 'Eat Fresh']) {
      const el = page.locator('p', { hasText: note });
      await expect(el).toBeVisible();
      expect(await el.evaluate((n) => getComputedStyle(n).fontFamily)).toMatch(/Caveat/);
    }
    expect(await h1.evaluate((n) => getComputedStyle(n).fontFamily)).not.toMatch(/Caveat/);
    expect(await page.locator('#main-content').innerText()).not.toMatch(FORBIDDEN);
  });

  test('CTAs point at real anchors, and "View All Categories" lands on a FarmBox-only categories page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    await expect(page.getByRole('link', { name: 'Shop FarmBox' })).toHaveAttribute('href', '#categories');
    await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how-it-works');
    await expect(page.getByRole('link', { name: 'Explore Combos' })).toHaveAttribute('href', '#combos');
    for (const id of ['categories', 'combos', 'how-it-works']) await expect(page.locator(`#${id}`)).toBeAttached();

    const all = page.getByRole('link', { name: 'View All Categories' });
    await expect(all).toHaveAttribute('href', `/categories/${SLUG}`);
    await all.click();
    await expect(page).toHaveURL(new RegExp(`/categories/${SLUG}$`));
    // Only FarmBox's block — not every vertical's (owner annotation 2026-10-09).
    await expect(page.locator(`section#${SLUG}`)).toBeAttached();
    await expect(page.locator('section#plants, section#tools')).toHaveCount(0);
  });

  test('combos: real cards, or the empty state with a way on — never placeholders', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    // The city-scoped list replaces the server's all-India one after hydration.
    await page.waitForLoadState('networkidle');
    const combos = page.locator('section#combos');
    const n = await combos.locator('[data-product-card]').count();
    if (n === 0) {
      await expect(combos.getByText(EMPTY)).toBeVisible();
      await expect(combos.getByRole('link', { name: 'Explore FarmBox Categories' })).toHaveAttribute(
        'href',
        `/categories/${SLUG}`,
      );
      await expect(combos.getByRole('link', { name: 'View All Combos' })).toHaveCount(0);
    } else {
      expect(n, 'combo cards').toBeLessThanOrEqual(6);
      await expect(combos.locator('a[href^="/products/"]').first()).toBeVisible();
      await expect(combos).toContainText(/₹\s?\d/);
      await expect(combos.getByRole('link', { name: 'View All Combos' })).toHaveAttribute('href', `/${SLUG}/search`);
    }
  });

  for (const width of [390, 768, 1024, 1366, 1440, 1920]) {
    test(`one city control, bottom nav on phones, clean console/images/overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const h = await hygiene(page);
      await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
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

/* ── Combos states with an intercepted list ────────────────────────────────────
 * The browser's city-scoped FarmBox list request (the seeded city makes the client refetch
 * after hydration) is answered with a real /tools list in the API's own shape — no FarmBox
 * product is listed anywhere yet — or with an empty list, or with a 500.
 */
type Body = { data: Record<string, unknown>[] } & Record<string, unknown>;
type Answer = { status: number; body: unknown; delay?: number };

async function serveFarmboxList(page: Page, answer: () => Answer) {
  await page.route(
    (url) => /\/products$/.test(url.pathname) && (url.searchParams.get('search') ?? '').includes(`type.slug:${SLUG}`),
    async (route) => {
      const origin = route.request().headers()['origin'] ?? '*';
      const cors = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
      };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const { status, body, delay } = answer();
      if (delay) await new Promise((r) => setTimeout(r, delay));
      await route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    },
  );
}

test.describe('/farmbox combos states (intercepted list)', () => {
  let tools: Body;

  test.beforeAll(async ({ request }) => {
    const r = await request.get(`${API}/products`, {
      params: {
        searchJoin: 'and',
        with: 'type;author',
        hide_unpriced: '1',
        limit: '6',
        language: 'en',
        search: 'type.slug:tools;status:publish;visibility:visibility_public',
      },
    });
    tools = await r.json();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED_CITY);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("cards: the site's one card, Add To Shopping Cart fills the cart, an out-of-stock product says so", async ({ page }) => {
    const body: Body = structuredClone(tools);
    test.skip(!body?.data || body.data.length < 2, 'no tools list to stand in');
    // Stand-ins, so the test doesn't depend on today's stock: one nationwide product in stock,
    // one sold out (the card's display-only rule for nationwide products).
    const [simple, soldOut] = [0, 1];
    body.data[simple] = { ...body.data[simple], product_type: 'simple', city_based: false, in_stock: 1, quantity: 50 };
    body.data[soldOut] = { ...body.data[soldOut], product_type: 'simple', city_based: false, in_stock: 0 };
    await serveFarmboxList(page, () => ({ status: 200, body }));

    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    const combos = page.locator('section#combos');
    const cards = combos.locator('[data-product-card]');
    await expect(cards).toHaveCount(body.data.length, { timeout: 20_000 });
    await expect(combos.getByText(EMPTY)).toHaveCount(0);
    await expect(combos.getByRole('link', { name: 'View All Combos' })).toHaveAttribute('href', `/${SLUG}/search`);
    await expect(cards.nth(soldOut)).toContainText(/Out of stock/i);

    await cards.nth(simple).getByRole('button', { name: 'Add To Shopping Cart', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('plantathome-cart') ?? '{}')?.items?.length ?? 0))
      .toBe(1);
  });

  test('empty list: the empty line and a way on to the categories', async ({ page }) => {
    await serveFarmboxList(page, () => ({
      status: 200,
      body: { data: [], total: 0, current_page: 1, last_page: 1, per_page: 6 },
    }));
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    await page.waitForLoadState('networkidle');
    const combos = page.locator('section#combos');
    await expect(combos.getByText(EMPTY)).toBeVisible();
    await expect(combos.locator('[data-product-card]')).toHaveCount(0);
    await expect(combos.getByRole('link', { name: 'Explore FarmBox Categories' })).toBeVisible();
    await expect(combos.getByRole('link', { name: 'View All Combos' })).toHaveCount(0);
  });

  /**
   * The owner's iPad "network error" (2026-10-08): a connection that drops for a moment must not
   * leave a section empty. No answer at all is retried (up to three times, with backoff), so two
   * dropped attempts in a row still end in real cards and no error line.
   */
  test('a dropped connection recovers by itself: no error line, the cards arrive', async ({ page }) => {
    test.skip(!tools?.data?.length, 'no tools list to recover with');
    let attempts = 0;
    await page.route(
      (url) => /\/products$/.test(url.pathname) && (url.searchParams.get('search') ?? '').includes(`type.slug:${SLUG}`),
      async (route) => {
        if (route.request().method() === 'OPTIONS') return route.continue();
        attempts += 1;
        if (attempts <= 2) return route.abort('internetdisconnected');
        const origin = route.request().headers()['origin'] ?? '*';
        await route.fulfill({
          status: 200,
          headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'content-type': 'application/json' },
          body: JSON.stringify(tools),
        });
      },
    );
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    const combos = page.locator('section#combos');
    await expect(combos.locator('[data-product-card]').first()).toBeVisible({ timeout: 30_000 });
    await expect(combos.getByText(ERROR)).toHaveCount(0);
    expect(attempts, 'two dropped attempts, then the answer').toBeGreaterThanOrEqual(3);
  });

  test('failed list: the error line, never raw errors; Try Again stays disabled while it retries', async ({ page }) => {
    test.skip(!tools?.data?.length, 'no tools list to recover with');
    let failing = true;
    await serveFarmboxList(page, () =>
      failing ? { status: 500, body: { message: 'Server Error' } } : { status: 200, body: tools, delay: 2_000 },
    );
    await page.goto(`/${SLUG}`, { waitUntil: 'domcontentloaded' });
    await hydrated(page);
    const combos = page.locator('section#combos');
    await expect(combos.getByText(ERROR)).toBeVisible({ timeout: 20_000 });
    await expect(combos).not.toContainText(/status code|Server Error|Request failed|Network Error/i);

    failing = false;
    const retry = combos.getByRole('button', { name: 'Try Again' });
    await retry.click();
    // Inside the 2 s the recovery takes: the button holds, disabled, and the empty line never flashes.
    await expect(retry).toBeDisabled();
    await expect(combos.getByText(EMPTY)).toHaveCount(0);
    await expect(combos.locator('[data-product-card]').first()).toBeVisible({ timeout: 20_000 });
  });
});
