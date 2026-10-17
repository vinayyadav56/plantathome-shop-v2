import { test, expect, Locator, Page } from '@playwright/test';

/**
 * /corporate-gifting — "Request a Custom Proposal" (owner's 2026-10-17 spec and mocks).
 *
 * Pins the contract, not the styling: one heading-font H1, the BreadcrumbList, the main
 * landmark and the form in the server HTML; the exact title and description; no first-visit
 * city modal over a B2B form; a summary that follows the form live; client validation that
 * keeps what was typed; the request the form sends (intercepted — nothing reaches the API)
 * and how a 201 and a 422 are shown; and at six widths the usual hygiene gates (no console
 * errors, no 4xx/5xx images, no horizontal overflow), one city control, the bottom nav on
 * phones and the summary panel collapsed below lg, open from lg.
 *
 * Read only: `corporate-leads` is stubbed in every browser test, so no enquiry is ever created.
 */

const H1 = 'Request a Custom Proposal';
const TITLE = 'Corporate Plant Gifting — Request a Custom Proposal | PlantAtHome';
const DESCRIPTION =
  'Plant gifting for employees, clients and corporate events. Share your occasion, quantity and budget and PlantAtHome will send a custom proposal with curated plants, branding and pan-India delivery.';

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

/* ── The lead endpoint, stubbed ──────────────────────────────────────────────────
 * The browser POSTs straight to the API host (CORS), so the stub answers the preflight too.
 * Returns the JSON bodies the page sent, so a test can pin the payload.
 */
type Answer = { status: number; body: unknown };
/** What the page POSTs (the fields a test pins). */
type Sent = {
  company?: string;
  email?: string;
  phone?: string;
  occasion?: string;
  quantity?: string;
  city?: string;
  source?: string;
  meta?: { preferred_date?: string; plant_preferences?: string[] };
};

async function stubLeads(page: Page, answer: () => Answer) {
  const posts: Sent[] = [];
  await page.route(
    (url) => /\/corporate-leads$/.test(url.pathname),
    async (route) => {
      const req = route.request();
      const cors = {
        'access-control-allow-origin': req.headers()['origin'] ?? '*',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': req.headers()['access-control-request-headers'] ?? 'content-type',
        'access-control-allow-methods': 'POST, OPTIONS',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      posts.push(req.postDataJSON());
      const { status, body } = answer();
      await route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    },
  );
  return posts;
}

const summaryRow = (page: Page, key: string) => page.locator(`[data-summary-row="${key}"] dd`);
const tile = (page: Page, label: string) => page.locator('label', { hasText: label });

/** Every required field, plus the Indoor plants tile. */
async function fillValid(page: Page) {
  await page.locator('#company').fill('Acme Corp');
  await page.locator('#name').fill('Priya Sharma');
  await page.locator('#email').fill('priya@example.com');
  await page.locator('#phone').click();
  await page.keyboard.type('9876543210');
  await page.locator('#occasion').selectOption('Employee gifting');
  await page.locator('#quantity').selectOption('100-249');
  await page.locator('#city').fill('Gurugram');
  await tile(page, 'Indoor plants').click();
}

test.describe('/corporate-gifting', () => {
  test('server HTML: one H1, BreadcrumbList, the main landmark and the form', async ({ request }) => {
    const res = await request.get('/corporate-gifting');
    expect(res.status()).toBeLessThan(400);
    const html = await res.text();
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const breadcrumb = ld.find((x) => x['@type'] === 'BreadcrumbList');
    expect(breadcrumb?.itemListElement?.map((i: { name: string }) => i.name)).toEqual(['Home', 'Corporate Gifting']);
    expect((html.match(/<h1[\s>]/g) ?? []).length, 'one h1').toBe(1);
    const h1Text = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(h1Text).toBe(H1);
    expect(html).toMatch(/<main[^>]*id="main-content"/);
    expect(html).toMatch(/<form[\s>]/);
  });

  test('one H1 in the site heading font, exact title and description', async ({ page }) => {
    await page.addInitScript(SEED_CITY);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(H1);
    await expect.poll(() => headingFont(h1), { timeout: 15_000 }).toBe(SITE_HEADING);
    await expect(page).toHaveTitle(TITLE);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', DESCRIPTION);
  });

  test('no city modal on a first visit: the form is usable at once', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('pah-agentation', 'off');
      } catch {
        /* noop */
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-city-chip]:visible').first()).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog').filter({ has: page.getByPlaceholder('Search your city') })).toHaveCount(0);
    // A modal would intercept this click.
    await page.locator('#company').click();
    await expect(page.locator('#company')).toBeFocused();
  });

  test.describe('the form', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(SEED_CITY);
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('the summary follows the form: text, a select and a plant tile on and off', async ({ page }) => {
      await stubLeads(page, () => ({ status: 500, body: {} }));
      await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await expect(summaryRow(page, 'company')).toHaveText('—');
      await page.locator('#company').fill('Acme Corp');
      await expect(summaryRow(page, 'company')).toHaveText('Acme Corp');
      await page.locator('#occasion').selectOption('Employee gifting');
      await expect(summaryRow(page, 'occasion')).toHaveText('Employee gifting');
      await page.locator('#quantity').selectOption('100-249');
      await expect(summaryRow(page, 'quantity')).toHaveText('100–249 gifts');

      const indoor = page.getByRole('checkbox', { name: 'Indoor plants' });
      await tile(page, 'Indoor plants').click();
      await expect(indoor).toBeChecked();
      await expect(summaryRow(page, 'plant_preferences')).toHaveText('Indoor plants');
      await tile(page, 'Indoor plants').click();
      await expect(indoor).not.toBeChecked();
      await expect(summaryRow(page, 'plant_preferences')).toHaveText('—');
    });

    test('an empty submit: every required field says so, nothing is sent, the typed value stays', async ({ page }) => {
      const posts = await stubLeads(page, () => ({ status: 500, body: {} }));
      await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await page.locator('#company').fill('Acme Corp');
      await page.getByRole('button', { name: 'Submit Request' }).click();
      await expect.poll(() => page.getByRole('alert').count()).toBeGreaterThanOrEqual(5);
      await expect(page.locator('#company')).toHaveValue('Acme Corp');
      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
      expect(posts, 'requests sent').toEqual([]);
    });

    test('201: "Request received"; the request carries the meta and an E.164 phone', async ({ page }) => {
      const posts = await stubLeads(page, () => ({ status: 201, body: { data: { id: 1 }, message: 'Thanks — our team will be in touch.' } }));
      await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await fillValid(page);
      await page.getByRole('button', { name: 'Submit Request' }).click();
      const done = page.getByRole('status');
      await expect(done).toContainText('Request received');
      await expect(done).toContainText('Thanks — our team will be in touch.');
      expect(posts).toHaveLength(1);
      const sent = posts[0];
      expect(sent.company).toBe('Acme Corp');
      expect(sent.email).toBe('priya@example.com');
      expect(sent.phone).toMatch(/^\+91\d{10}$/);
      expect(sent.occasion).toBe('Employee gifting');
      expect(sent.quantity).toBe('100-249');
      expect(sent.city).toBe('Gurugram');
      expect(sent.source).toBe('corporate');
      expect(sent.meta?.plant_preferences).toEqual(['indoor']);
      expect(sent.meta?.preferred_date ?? null).toBeNull();
      // What was sent stays in the summary until "Send another request".
      await expect(summaryRow(page, 'company')).toHaveText('Acme Corp');
      await page.getByRole('button', { name: 'Send another request' }).click();
      await expect(page.locator('#company')).toHaveValue('');
      await expect(summaryRow(page, 'company')).toHaveText('—');
    });

    test('422: the message under its field and in the banner, the values retained', async ({ page }) => {
      await stubLeads(page, () => ({
        status: 422,
        body: { message: 'The given data was invalid.', errors: { email: ['This email domain is not accepted.'] } },
      }));
      await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await fillValid(page);
      await page.getByRole('button', { name: 'Submit Request' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'This email domain is not accepted.' })).toBeVisible();
      await expect(page.getByRole('alert').filter({ hasText: 'The given data was invalid.' })).toBeVisible();
      await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#company')).toHaveValue('Acme Corp');
      await expect(page.locator('#city')).toHaveValue('Gurugram');
      await expect(page.getByRole('checkbox', { name: 'Indoor plants' })).toBeChecked();
      await expect(page.getByRole('status')).toHaveCount(0);
    });
  });

  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    test(`one city control, bottom nav on phones, summary collapsed below lg, clean console/images/overflow at ${width}px`, async ({ page }) => {
      await page.addInitScript(SEED_CITY);
      await page.setViewportSize({ width, height: 900 });
      const h = await hygiene(page);
      await page.goto('/corporate-gifting', { waitUntil: 'domcontentloaded' });
      await hydrated(page);
      await expect(page.locator('[data-city-chip]:visible')).toHaveCount(1);
      if (width < 768) {
        await expect(page.locator('nav').filter({ has: page.locator('a[href="/cart"]') }).first()).toBeVisible();
      }
      const summary = page.locator('#enquiry-summary');
      const toggle = page.getByRole('button', { name: 'Your enquiry summary' });
      if (width < 1024) {
        await expect(summary).toBeHidden();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(summary).toBeVisible();
      } else {
        await expect(toggle).toBeHidden();
        await expect(summary).toBeVisible();
      }
      await scrollThrough(page);
      await h.assert();
    });
  }
});
