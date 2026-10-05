import { test, expect, Page } from '@playwright/test';

/**
 * The shopping-city control must be reachable from ANY page at ANY scroll
 * position and ANY width.
 *
 * It regressed twice, both times invisibly, because the control's existence
 * depended on scroll maths:
 *
 *   - the chip lived in a 48px announcement strip that is `position: relative`
 *     and scrolls away, while the bar that replaced it only appeared past
 *     `scrollY > 150` — so 45→150px there was no city control on the page;
 *   - that bar was also gated on `window.innerWidth < 768`, so on desktop, and
 *     on a large phone in LANDSCAPE, the city was gone for the rest of the
 *     session after ~48px of scroll.
 *
 * The fix removed the scroll machinery entirely. The chip then lived in a
 * sticky green announcement strip (owner annotation, 29 Sep); on 5 Oct the
 * owner removed that strip and the chip moved INTO the sticky header bar, one
 * instance for every width.
 *
 * So the invariant these tests pin is deliberately about BEHAVIOUR, not about
 * which container holds the chip: exactly one chip, visible, at every path,
 * offset and width. That is what lets the chip be re-homed on request without
 * the guarantee quietly lapsing.
 *
 * READ ONLY: opens the picker but never switches city, so it is safe against
 * any environment.
 */

const CHIP = '[data-city-chip]';

const PATHS = [
  '/',
  '/plants',
  '/c/indoor',
  '/plants/search?text=plant',
  '/cart',
  '/categories',
  '/terms',
];

/**
 * The PDP is where this was reported, but product slugs differ per environment,
 * so discover one from the listing rather than hardcoding a slug that 404s
 * somewhere else.
 */
async function firstProductPath(page: Page): Promise<string> {
  await page.goto('/plants', { waitUntil: 'domcontentloaded' });
  const href = await page
    .locator('a[href^="/products/"]')
    .first()
    .getAttribute('href', { timeout: 15000 });
  if (!href) throw new Error('no product link found on /plants');
  return href;
}

/** Widths either side of every breakpoint the header uses (sm/md/lg/xl). */
const WIDTHS = [320, 360, 390, 414, 640, 767, 768, 900, 1024, 1440];

/** 45 and 150 are the old dead-zone edges; 48 is the strip height. */
const OFFSETS = [0, 45, 48, 60, 100, 140, 150, 200, 400];

/** A city must be set, or the blocking LocationGate picker covers the page. */
async function seedCity(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('pah_customer_city', 'Delhi');
      localStorage.setItem('pah_customer_area', 'Rohini');
      sessionStorage.setItem('pah-city-gate-dismissed', '1');
    } catch {
      /* private mode — the gate will show and the test will say so */
    }
  });
}

/** Chips that are actually on screen, not merely in the DOM. */
async function visibleChips(page: Page) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].filter((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const cs = getComputedStyle(el as HTMLElement);
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.bottom > 0 &&
        r.top < window.innerHeight &&
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        Number(cs.opacity) > 0.05
      );
    }).length;
  }, CHIP);
}

test.describe('shopping-city chip is always reachable', () => {
  test.beforeEach(async ({ page }) => seedCity(page));

  for (const path of PATHS) {
    test(`exactly one chip at every scroll offset — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      for (const y of OFFSETS) {
        await page.evaluate((offset) => window.scrollTo(0, offset), y);
        await page.waitForTimeout(150);
        expect(await visibleChips(page), `${path} @ scrollY=${y}`).toBe(1);
      }

      // and at the very bottom, where the strip is long out of view
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(150);
      expect(await visibleChips(page), `${path} @ bottom`).toBe(1);
    });
  }

  test('exactly one chip at every scroll offset — a real product page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pdp = await firstProductPath(page);
    await page.goto(pdp, { waitUntil: 'domcontentloaded' });
    for (const y of OFFSETS) {
      await page.evaluate((offset) => window.scrollTo(0, offset), y);
      await page.waitForTimeout(150);
      expect(await visibleChips(page), `${pdp} @ scrollY=${y}`).toBe(1);
    }
  });

  test('exactly one chip at every width, scrolled past the strip', async ({ page }) => {
    const pdp = await firstProductPath(page);
    await page.goto(pdp, { waitUntil: 'domcontentloaded' });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(150);
      expect(await visibleChips(page), `width=${width}`).toBe(1);

      // the pill must not push the document wider than the viewport
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `horizontal overflow at width=${width}`).toBeLessThanOrEqual(1);
    }
  });

  test('survives a rotation mid-scroll', async ({ page }) => {
    // The old implementation listened to `resize` and removed the control the
    // moment the viewport crossed 768px — rotating a phone deleted it.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(150);
    expect(await visibleChips(page)).toBe(1);

    await page.setViewportSize({ width: 932, height: 430 }); // landscape
    await page.waitForTimeout(200);
    expect(await visibleChips(page), 'after rotating to landscape').toBe(1);
  });

  test('reads as a control and opens the picker', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });
    const chip = page.locator(`${CHIP}:visible`).first();
    await expect(chip).toBeVisible();

    // It was reported as "disabled" while being perfectly clickable — it simply
    // had no border, hover or focus style. Assert the affordance, not just the
    // behaviour.
    const style = await chip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderWidth: parseFloat(cs.borderTopWidth),
        cursor: cs.cursor,
        opacity: Number(cs.opacity),
        disabled: (el as HTMLButtonElement).disabled,
        ariaDisabled: el.getAttribute('aria-disabled'),
      };
    });
    expect(style.borderWidth).toBeGreaterThanOrEqual(1);
    expect(style.cursor).toBe('pointer');
    expect(style.opacity).toBe(1);
    expect(style.disabled).toBe(false);
    expect(style.ariaDisabled).toBeNull();
    await expect(chip).toHaveAttribute('aria-label', /change city/i);

    await chip.click();
    // The Headless UI wrapper carries role=dialog but has no box of its own —
    // assert on the panel's heading, which is what the shopper actually sees.
    await expect(
      page.getByRole('heading', { name: /choose your delivery city|select your shopping city/i }),
    ).toBeVisible();
  });

  test('shows the area only where there is room for it', async ({ page }) => {
    await page.goto('/plants', { waitUntil: 'domcontentloaded' });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await expect(page.locator(`${CHIP}:visible`).first()).toHaveText(/Delhi/);
    expect(await page.locator(`${CHIP}:visible`).first().innerText()).not.toContain('Rohini');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    expect(await page.locator(`${CHIP}:visible`).first().innerText()).toContain('Rohini');
  });
});
