import { test, expect, Page, Request } from '@playwright/test';

/**
 * The tracking SDK's contract with the API, observed from the browser:
 *
 *   - a page view carries a visitor id, a session id, the path (never the
 *     query string) and the utm_* first-touch;
 *   - a product page sends an explicit product_view with the catalogue id;
 *   - a heartbeat goes out every 30 s while the tab is visible, carries NO
 *     events, and stops the moment the tab is hidden;
 *   - no beacon ever gets a 5xx (the API's contract is "always 204").
 *
 * Beacons are intercepted, not asserted against the API's tables, so this is
 * safe against any environment. The clock is faked so a 30 s heartbeat is a
 * `runFor`, not a wait.
 */

const TRACK = /\/(api|rest-api)\/track(\/crawl)?(\?|$)/;

type Beacon = { url: string; body: any };

function captureBeacons(page: Page): Beacon[] {
  const beacons: Beacon[] = [];
  page.on('request', (req: Request) => {
    if (req.method() !== 'POST' || !TRACK.test(req.url())) return;
    let body: any = null;
    try {
      body = JSON.parse(req.postData() ?? 'null');
    } catch {
      body = null;
    }
    beacons.push({ url: req.url(), body });
  });
  return beacons;
}

const pageViews = (b: Beacon[]) =>
  b.filter((x) => Array.isArray(x.body?.events) && x.body.events.some((e: any) => e.type === 'page_view'));
const heartbeats = (b: Beacon[]) => b.filter((x) => x.body?.heartbeat === true);

test.describe('tracking SDK', () => {
  test('page view carries identity, a clean path and the utm first-touch', async ({ page }) => {
    const beacons = captureBeacons(page);
    await page.goto('/?utm_source=e2e&utm_medium=test&secret=nope', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => pageViews(beacons).length, { timeout: 15_000 }).toBeGreaterThan(0);

    const first = pageViews(beacons)[0].body;
    expect(first.visitor_id).toMatch(/^[\w-]{8,64}$/);
    expect(first.session_id).toMatch(/^[\w-]{8,64}$/);
    expect(first.page).toBe('/');
    expect(JSON.stringify(first)).not.toContain('secret=nope');
    expect(first.utm).toMatchObject({ utm_source: 'e2e', utm_medium: 'test' });
    for (const e of first.events) expect(e.url ?? '/').not.toContain('?');

    // The cookie + session survive a navigation; the first touch is remembered.
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => pageViews(beacons).length, { timeout: 15_000 }).toBeGreaterThan(1);
    const second = pageViews(beacons)[1].body;
    expect(second.visitor_id).toBe(first.visitor_id);
    expect(second.session_id).toBe(first.session_id);
    expect(second.utm?.utm_source).toBe('e2e');
  });

  test('a product page sends product_view with the catalogue id', async ({ page }) => {
    const beacons = captureBeacons(page);
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const link = page.locator('a[href^="/products/"]').first();
    await expect(link).toBeAttached({ timeout: 20_000 });
    // Navigate to the href rather than click: on a fresh session the city gate
    // can sit over the grid, and the click would land on it.
    const href = await link.getAttribute('href');
    await page.goto(href!, { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        () => beacons.flatMap((b) => b.body?.events ?? []).filter((e: any) => e.type === 'product_view').length,
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
    const pv = beacons.flatMap((b) => b.body?.events ?? []).find((e: any) => e.type === 'product_view');
    expect(pv.meta?.product_id).toBeTruthy();
    expect(pv.url).toMatch(/^\/products\//);
  });

  test('heartbeats every 30 s while visible, none while hidden, never a 5xx', async ({ page }) => {
    const beacons = captureBeacons(page);
    const bad: string[] = [];
    page.on('response', (res) => {
      if (res.request().method() === 'POST' && TRACK.test(res.url()) && res.status() >= 500) bad.push(`${res.status()} ${res.url()}`);
    });

    await page.clock.install();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => pageViews(beacons).length, { timeout: 15_000 }).toBeGreaterThan(0);

    const before = heartbeats(beacons).length;
    await page.clock.runFor(31_000);
    await expect.poll(() => heartbeats(beacons).length, { timeout: 10_000 }).toBeGreaterThan(before);
    const beat = heartbeats(beacons).at(-1)!.body;
    expect(beat.events).toEqual([]);
    expect(beat.visitor_id).toBe(pageViews(beacons)[0].body.visitor_id);

    // Hide the tab: the SDK reads document.visibilityState, so this is enough.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hiddenAt = heartbeats(beacons).length;
    await page.clock.runFor(95_000);
    expect(heartbeats(beacons).length).toBe(hiddenAt);

    expect(bad, 'tracking beacons must never 5xx').toEqual([]);
  });
});
