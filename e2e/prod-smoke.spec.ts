import { test, expect, Page } from '@playwright/test';

/**
 * PRODUCTION READ-ONLY smoke for https://www.plantathome.in
 *
 * Asserts, for each key storefront page:
 *   - HTTP 2xx on the main document
 *   - ZERO console errors (0-console-error gate)
 *   - no uncaught page errors (hydration/runtime)
 *   - no 5xx sub-requests
 *   - no failed image/asset loads (excluding benign GA beacons + Next.js
 *     `_rsc` prefetch cancellations, which the browser routinely aborts)
 *   - SSR/rendered content present (not a bare spinner)
 *
 * READ ONLY: never submits forms, never orders. Safe to run against live prod.
 */

const BASE = process.env.SMOKE_BASE_URL || 'https://www.plantathome.in';

// name -> path. Uses real slugs verified live on 2026-07-14.
const PAGES: Array<[string, string, RegExp]> = [
  ['home', '/', /Plant\s*atHome/i],
  ['plants-category', '/plants', /./],
  ['category-indoor', '/c/indoor', /./],
  ['pdp', '/products/premium-potting-mix', /./],
  ['search', '/plants/search?text=plant', /./],
  ['offers', '/offers', /./],
  ['categories', '/categories', /./],
  ['signin', '/signin', /Welcome back|Log ?in|Email/i],
  ['track-order', '/track-order', /./],
  ['terms', '/terms', /./],
  ['privacy', '/privacy', /./],
];

// Requests we tolerate failing/aborting — not storefront defects.
function isBenignFailure(url: string): boolean {
  return (
    url.includes('google-analytics.com') ||
    url.includes('googletagmanager.com') ||
    url.includes('/g/collect') ||
    /[?&]_rsc=/.test(url) || // Next.js App Router prefetch, routinely aborted
    url.includes('doubleclick.net')
  );
}

for (const [name, path, contentRe] of PAGES) {
  test(`prod smoke: ${name} (${path})`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const page: Page = await ctx.newPage();

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const server5xx: string[] = [];
    const badImages: string[] = [];
    const realFailures: string[] = [];

    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('requestfailed', (r) => {
      if (!isBenignFailure(r.url())) {
        realFailures.push(`${r.url()} ${r.failure()?.errorText ?? ''}`);
      }
    });
    page.on('response', (res) => {
      const s = res.status();
      const url = res.url();
      if (s >= 500 && !isBenignFailure(url)) server5xx.push(`${s} ${url}`);
      if (res.request().resourceType() === 'image' && s >= 400) {
        badImages.push(`${s} ${url}`);
      }
    });

    const resp = await page.goto(BASE + path, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });

    // 1. main document 2xx
    expect(resp, 'navigation response').toBeTruthy();
    expect(resp!.status(), `HTTP status for ${path}`).toBeLessThan(300);
    expect(resp!.status()).toBeGreaterThanOrEqual(200);

    // Let hydration + lazy content settle.
    await page.waitForTimeout(2000);

    // 2. SSR / rendered content present (not a bare spinner).
    const text = (await page.evaluate(() => document.body.innerText || '')).trim();
    expect(text.length, `rendered text length for ${path}`).toBeGreaterThan(50);
    expect(text).toMatch(contentRe);

    // 3. no 5xx sub-requests
    expect(server5xx, `5xx sub-requests on ${path}`).toEqual([]);

    // 4. zero console errors
    expect(consoleErrors, `console errors on ${path}`).toEqual([]);

    // 5. no uncaught page errors (hydration mismatches surface here)
    expect(pageErrors, `page errors on ${path}`).toEqual([]);

    // 6. no real (non-benign) request failures
    expect(realFailures, `failed requests on ${path}`).toEqual([]);

    // 7. no broken image responses (4xx/5xx). Lazy images that never
    //    fired a request are fine; a 4xx/5xx image response is not.
    expect(badImages, `broken image loads on ${path}`).toEqual([]);

    await ctx.close();
  });
}

test('prod smoke: home links + PDP images resolve', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(2000);

  const links = [
    ...new Set(
      await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))
    ),
  ].filter((h): h is string => !!h && h.startsWith('/') && !h.includes('#'));

  const brokenLinks: string[] = [];
  for (const h of links.slice(0, 30)) {
    const r = await page.request.get(BASE + h, { timeout: 20_000 });
    if (r.status() >= 400) brokenLinks.push(`${h} ${r.status()}`);
  }
  expect(brokenLinks, 'broken internal links on home').toEqual([]);

  // PDP: scroll to force lazy image load, then assert every img decoded.
  await page.goto(BASE + '/products/premium-potting-mix', {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1000);
  const zeroWidth = await page.$$eval('img', (is) =>
    is
      .filter((i) => {
        const src = i.currentSrc || i.src;
        return src && !src.startsWith('data:') && i.naturalWidth === 0;
      })
      .map((i) => i.currentSrc || i.src)
  );
  expect(zeroWidth, 'undecoded PDP images after scroll').toEqual([]);
});
