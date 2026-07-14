import { test, expect, Page } from '@playwright/test';

/**
 * Storefront core commerce golden path (STAGING):
 *   home -> PDP -> size select (price update) -> "Choose your pot" picker
 *   (size-matched pots + material filter + pot as its own cart line)
 *   -> add to cart -> cart drawer math -> guest checkout -> Check Availability
 *   -> POST /orders/checkout/verify (200).
 *
 * Every page is asserted to have ZERO console errors.
 *
 * It also guards the price-integrity invariant that CURRENTLY FAILS on staging
 * (2026-07-14): the PDP advertises the location/margin selling price (e.g.
 * Monstera Medium = Rs 669.90) but the cart + checkout order-summary + verify
 * request send the raw catalog variation price (Rs 609). The server re-prices
 * to 669.90, so the displayed cart total understates what the customer is
 * charged. The `priceConsistency` test encodes that invariant so a fix flips
 * it green.
 */

const BASE = process.env.SHOP_BASE ?? 'https://plantathome-shop-staging.vercel.app';
const PRODUCT = 'monstera-deliciosa';

// Ignore third-party analytics/beacon noise; only fail on app console errors.
const IGNORE_ERROR = /google-analytics|googletagmanager|gtag|doubleclick|facebook|clarity|hotjar|favicon/i;

function attachConsoleGuard(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORE_ERROR.test(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

const rupees = (t: string | null | undefined): number =>
  Number(String(t ?? '').replace(/[^0-9.]/g, '')) || 0;

test.describe('Storefront golden path', () => {
  test('home -> PDP -> pot -> cart -> guest checkout -> verify 200', async ({ page }) => {
    const errors = attachConsoleGuard(page);

    // --- Home ---
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/PlantAtHome/i);
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();

    // --- PDP ---
    await page.goto(`${BASE}/products/${PRODUCT}`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Monstera/i);

    // Price starts as a range; Select Options is disabled until a size is chosen.
    const selectOptions = page.getByRole('button', { name: /Select Options/i }).first();
    await expect(selectOptions).toBeDisabled();

    // Size selection updates the price to a single value.
    await page.getByRole('button', { name: 'Medium', exact: true }).click();
    const pdpPriceText = await page
      .locator('text=/Sale price/i')
      .locator('xpath=following-sibling::*[1]')
      .first()
      .textContent()
      .catch(() => null);
    const pdpSelectedPrice = rupees(
      pdpPriceText ?? (await page.locator('text=/₹[0-9]/').first().textContent()),
    );
    expect(pdpSelectedPrice).toBeGreaterThan(0);

    // --- "Choose your pot" picker ---
    await page.getByRole('button', { name: /With Pot/i }).click();
    // Material filter narrows the size-matched pots.
    await page.getByRole('button', { name: 'Wooden', exact: true }).click();
    const woodenPots = page.locator('button', { hasText: /Wooden ·/ });
    await expect(woodenPots.first()).toBeVisible();
    // Every shown pot must be size-matched to the chosen plant size (Medium).
    const potLabels = await woodenPots.allTextContents();
    for (const label of potLabels) expect(label).toMatch(/·\s*Medium/);

    const chosenPot = woodenPots.first();
    const potPrice = rupees((await chosenPot.textContent())?.match(/₹[\d,]+/)?.[0]);
    await chosenPot.click();

    // Add plant + pot (pot is added as its own cart line).
    const addToCart = page.locator('button.flex-1', { hasText: /Add to Cart/i }).first();
    await expect(addToCart).toBeEnabled();
    await addToCart.click();

    // --- Cart drawer math ---
    const drawer = page.locator('#headlessui-portal-root');
    await expect(drawer.getByText(/Your Cart/i)).toBeVisible();
    await expect(drawer.getByText(/2 Items/i)).toBeVisible();

    const drawerText = await drawer.innerText();
    const plantLine = rupees(drawerText.match(/Monstera[^₹]*₹([\d,.]+)/)?.[1]);
    const potLine = rupees(drawerText.match(/Pot[^₹]*₹([\d,.]+)|Planter[^₹]*₹([\d,.]+)/)?.[0]);
    const subtotal = rupees(drawerText.match(/Subtotal[^₹]*₹([\d,.]+)/)?.[1]);
    expect(subtotal).toBeCloseTo(plantLine + (potLine || potPrice), 1);

    // PRICE-INTEGRITY INVARIANT (currently FAILS on staging):
    // the price advertised on the PDP for the selected variation must equal the
    // price charged for that line in the cart.
    expect(
      plantLine,
      `PDP shows ₹${pdpSelectedPrice} but cart charges ₹${plantLine} for the same Monstera Medium`,
    ).toBeCloseTo(pdpSelectedPrice, 1);

    // --- Guest checkout ---
    await drawer.getByRole('button', { name: /Proceed to Checkout/i }).click();
    await page.getByRole('button', { name: /Checkout as guest/i }).click();
    await expect(page).toHaveURL(/\/checkout\/guest/);
    await expect(page.getByRole('heading', { name: /Your Order/i })).toBeVisible();

    // Fill the minimum: contact number, name, billing + shipping address.
    await fillGuestForm(page);

    // --- Check Availability -> verify ---
    const [verifyResp] = await Promise.all([
      page.waitForResponse(
        (r) => /\/orders\/checkout\/verify/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 20_000 },
      ),
      page.getByRole('button', { name: /Check Availability/i }).click(),
    ]);
    expect(verifyResp.status(), 'checkout/verify must return 200').toBe(200);

    // Server-authoritative pricing must match what the cart displayed/charged.
    const body = await verifyResp.json();
    const priced = (body.priced_products ?? []).find((p: any) => p.product_id === 1);
    if (priced) {
      expect(
        priced.unit_price,
        `verify prices Monstera at ₹${priced.unit_price} but cart line was ₹${plantLine}`,
      ).toBeCloseTo(plantLine, 1);
    }

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  // Individual page smoke: every core page must render clean with 0 console errors.
  for (const path of ['/', '/categories', '/c/indoor', '/plants/search', `/products/${PRODUCT}`]) {
    test(`no console errors on ${path}`, async ({ page }) => {
      const errors = attachConsoleGuard(page);
      const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      expect(resp?.status(), `${path} HTTP`).toBeLessThan(400);
      await expect(page).toHaveTitle(/PlantAtHome/i);
      expect(errors, `console errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

/** Fill contact number, name, and a billing + shipping address in the guest form. */
async function fillGuestForm(page: Page) {
  const setNative = async (selector: string, value: string) => {
    await page.evaluate(
      ({ selector, value }) => {
        const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) return;
        const proto =
          el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      { selector, value },
    );
  };

  // Contact number
  await page.getByRole('button', { name: 'Add' }).first().click();
  await setNative('#headlessui-portal-root input', '+919876543210');
  await page.getByRole('button', { name: /Add Contact/i }).click();

  // Name
  await setNative('input[placeholder*="full name" i]', 'QA Test User');

  // Billing then shipping address
  for (const type of ['Billing', 'Shipping'] as const) {
    await page.getByRole('button', { name: 'Add' }).last().click();
    const dialog = page.locator('#headlessui-portal-root [role="dialog"]');
    await expect(dialog).toBeVisible();
    if (type === 'Shipping') await dialog.getByText('Shipping', { exact: true }).click();

    await page.evaluate((addrType) => {
      const p = document.getElementById('headlessui-portal-root')!;
      const set = (el: any, v: string) => {
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const selSet = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
      const selects = [...p.querySelectorAll('select')] as HTMLSelectElement[];
      const state = selects[0];
      const stateOpt = [...state.options].find((o) => o.textContent === 'Haryana')!;
      selSet.call(state, stateOpt.value);
      state.dispatchEvent(new Event('change', { bubbles: true }));
      const city = selects[1];
      const cityOpt = [...city.options].find((o) => /Gurugram|Gurgaon/i.test(o.textContent || '')) || city.options[1];
      selSet.call(city, cityOpt.value);
      city.dispatchEvent(new Event('change', { bubbles: true }));
      const labelInput = (label: string) => {
        const lab = [...p.querySelectorAll('*')].find(
          (e) => e.children.length === 0 && e.textContent?.trim() === label,
        );
        return lab?.parentElement?.querySelector('input') as HTMLInputElement | null;
      };
      const title = labelInput('Title');
      if (title) set(title, 'Home');
      const pin = labelInput('PIN Code');
      if (pin) set(pin, '122001');
      const ta = p.querySelector('textarea');
      if (ta) set(ta, '123 QA Street Sector 45');
      const emptyInput = [...p.querySelectorAll('input')].find(
        (i: any) => !i.value && i.offsetParent !== null,
      ) as HTMLInputElement | undefined;
      if (emptyInput) set(emptyInput, '123 QA Street Sector 45');
    }, type);

    await page.getByRole('button', { name: /Update Address/i }).click();
    await expect(page.locator('#headlessui-portal-root [role="dialog"]')).toHaveCount(0);
  }
}
