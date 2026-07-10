import { chromium } from 'playwright';

const SHOP = process.env.SHOP_URL || 'http://localhost:3010';
const API = 'https://plantathome-production.up.railway.app/api/v1';
const PW = 'Passw0rd!';
const NA = '11111111-1111-1111-1111-111111111111';
const SHOT = '/private/tmp/claude-501/-Users-vinayyadav-PlantAtHome-Pickbazar-Laravel-11-10-Pickbazar-Laravel-react-next-rest-graphql-ecommerce/18004e45-6460-498c-8094-aa2e2eff9cab/scratchpad';

const tag = Math.random().toString(36).slice(2, 8);
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
const api = (path, token, method = 'GET', body) =>
  fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(j);

// ── 1. Admin sets up a wired product in a fresh, covered city ──────────────
const admin = (await api('/auth/login', null, 'POST', { email: 'admin@plantathome.test', password: PW })).body.data.tokens.access_token;
const prod = (await api('/catalog/products', admin, 'POST', { name: `Loop Fern ${tag}`, status: 'published', variants: [{ size_code: 'M' }] })).body.data;
const variant = prod.variants[0].uuid;
await api('/pricing/base-prices', admin, 'POST', { sellable_type: 'variant', sellable_uuid: variant, amount: 349 });
await api('/inventory/stock', admin, 'PUT', { sellable_type: 'variant', sellable_uuid: variant, nursery_id: NA, qty_on_hand: 9 });
const city = (await api('/serviceability/cities', admin, 'POST', { name: `LoopCity ${tag}` })).body.data;
await api('/serviceability/coverage', admin, 'PUT', { nursery_id: NA, city_uuid: city.uuid, delivery_radius_km: 0 });
console.log(`setup: product=${prod.uuid} city=${city.uuid} (${city.name})`);

// ── 2. Drive the storefront ────────────────────────────────────────────────
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const steps = [];
const step = (name, ok, detail = '') => {
  steps.push({ name, ok });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  // Home + pick city
  await page.goto(SHOP, { waitUntil: 'networkidle' });
  await page.selectOption('select[aria-label="Select your city"]', city.uuid);
  step('selected city', (await page.inputValue('select[aria-label="Select your city"]')) === city.uuid);

  // PDP: price resolves from config→nursery→quote
  await page.goto(`${SHOP}/products/${prod.uuid}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="pdp-price"]');
      return el && el.textContent && el.textContent.trim() !== '—';
    },
    { timeout: 15000 },
  );
  const pdpPrice = (await page.locator('[data-testid="pdp-price"]').textContent())?.trim();
  step('PDP shows a config-driven price', /₹|\d/.test(pdpPrice || ''), pdpPrice);

  // Add to cart → should bounce anonymous user to /login
  await page.click('[data-testid="add-to-cart"]');
  await page.waitForURL(/\/login/, { timeout: 10000 });
  step('anonymous add-to-cart redirects to login', page.url().includes('/login'));

  // Login as the demo customer (email is prefilled)
  await page.fill('input[type="password"]', PW);
  await page.click('button[type="submit"]');

  // Pending intent replays → lands on /cart with the item
  await page.waitForURL(/\/cart/, { timeout: 15000 });
  await page.waitForSelector('[data-testid="to-checkout"]', { timeout: 10000 });
  const cartHasItem = (await page.locator('text=Remove').count()) > 0;
  step('login replayed pending add → cart has item', cartHasItem);

  // Checkout
  await page.click('[data-testid="to-checkout"]');
  await page.waitForURL(/\/checkout/, { timeout: 10000 });
  await page.fill('input[placeholder="Flat / house, street, area"]', '12 Garden Lane');
  await page.click('[data-testid="continue-to-pay"]');
  await page.waitForSelector('[data-testid="checkout-total"]', { timeout: 15000 });
  const checkoutTotal = (await page.locator('[data-testid="checkout-total"]').textContent())?.trim();
  step('checkout session created + total shown', /\d/.test(checkoutTotal || ''), checkoutTotal);

  // Pay → order confirmation
  await page.click('[data-testid="pay-now"]');
  await page.waitForURL(/\/orders\//, { timeout: 20000 });
  await page.waitForSelector('[data-testid="order-total"]', { timeout: 10000 });
  const orderTotal = (await page.locator('[data-testid="order-total"]').textContent())?.trim();
  const placed = (await page.locator('text=Order placed').count()) > 0;
  step('order placed + confirmation shows total', placed && /\d/.test(orderTotal || ''), orderTotal);

  await page.screenshot({ path: `${SHOT}/loop_order.png`, fullPage: true });
} catch (e) {
  step(`EXCEPTION: ${e.message}`, false);
  await page.screenshot({ path: `${SHOT}/loop_fail.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log('\nconsole errors:', errors.length ? '\n  - ' + errors.slice(0, 8).join('\n  - ') : 'none');
const passed = steps.filter((s) => s.ok).length;
const allOk = passed === steps.length && steps.length >= 6 && errors.length === 0;
console.log(`\nRESULT: ${passed}/${steps.length} steps passed, ${errors.length} console errors`);
console.log(allOk ? 'FULL M1 LOOP VERIFIED ✓' : 'M1 LOOP INCOMPLETE ✗');
process.exit(allOk ? 0 : 1);
