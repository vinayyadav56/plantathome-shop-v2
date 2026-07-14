// Legacy marvel REST API contract smoke — the /api the live shop actually consumes.
// Run: node --test e2e/legacy-api-contract.test.mjs
// Override target: API_BASE=https://api.plantathome.in/api node --test e2e/legacy-api-contract.test.mjs
//
// Covers the storefront-critical read surface enumerated from
// packages/marvel/src/Rest/Routes.php: settings, types, categories, products
// (list / by-slug / filters / search), flash-sale, coupons (+verify),
// store-notices, auth token/register, and the guest checkout-verify path.
// Asserts status codes, JSON shape stability, pagination correctness, price
// units (rupees, not paise), and that filters actually filter.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_BASE || 'https://plantathome-production.up.railway.app/api';

async function get(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
}
async function post(path, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text };
}

const PAGINATION_KEYS = ['data', 'current_page', 'per_page', 'total', 'last_page', 'from', 'to'];
function assertPaginator(json, msg) {
  assert.ok(json && typeof json === 'object', `${msg}: body is object`);
  for (const k of PAGINATION_KEYS) assert.ok(k in json, `${msg}: has "${k}"`);
  assert.ok(Array.isArray(json.data), `${msg}: data is array`);
}

test('GET /settings — 200, INR currency, options object', async () => {
  const { status, json } = await get('settings');
  assert.equal(status, 200);
  assert.ok(json.options && typeof json.options === 'object', 'has options object');
  assert.equal(json.options.currency, 'INR', 'currency is INR');
});

test('GET /types — 200, array of verticals with slugs', async () => {
  const { status, json } = await get('types');
  assert.equal(status, 200);
  assert.ok(Array.isArray(json), 'types is a bare array');
  assert.ok(json.length > 0, 'at least one type');
  for (const t of json) assert.ok(typeof t.slug === 'string' && t.slug.length, 'type has slug');
});

test('GET /categories — paginator, honors limit, root-parent filter', async () => {
  const { status, json } = await get('categories?limit=5');
  assert.equal(status, 200);
  assertPaginator(json, 'categories');
  assert.equal(json.per_page, 5, 'per_page honors limit');
  assert.ok(json.data.length <= 5, 'page size clamped to limit');
  // parent=null must not error and must return a paginator (all-roots in a flat tree is valid)
  const rootRes = await get('categories?limit=100&parent=null');
  assert.equal(rootRes.status, 200);
  assertPaginator(rootRes.json, 'categories parent=null');
});

test('GET /products — paginator, prices in RUPEES not paise', async () => {
  const { status, json } = await get('products?limit=3');
  assert.equal(status, 200);
  assertPaginator(json, 'products');
  assert.equal(json.per_page, 3);
  assert.ok(json.total > 0, 'catalog non-empty');
  const p = json.data[0];
  assert.ok('id' in p && 'slug' in p && 'name' in p, 'product has id/slug/name');
  // Rupee sanity: a real plant priced in paise would be < 20 (e.g. 4.89).
  const priceish = p.min_price ?? p.price ?? p.max_price;
  if (priceish != null && priceish > 0) {
    assert.ok(priceish >= 20, `price ${priceish} looks like rupees, not paise`);
  }
});

test('GET /products/{slug} — 200 for real slug, 404 for bogus', async () => {
  const list = await get('products?limit=1');
  const slug = list.json.data[0].slug;
  const ok = await get(`products/${slug}`);
  assert.equal(ok.status, 200);
  assert.equal(ok.json.slug, slug, 'returns the requested product');
  const bad = await get('products/this-slug-does-not-exist-xyz-000');
  assert.equal(bad.status, 404, 'bogus slug is 404');
});

test('filter search=type.slug:X actually filters', async () => {
  const { status, json } = await get('products?limit=10&search=type.slug:plants');
  assert.equal(status, 200);
  const slugs = [...new Set(json.data.map((p) => p.type && p.type.slug))];
  assert.deepEqual(slugs, ['plants'], 'page contains only plants');
  const none = await get('products?limit=5&search=type.slug:zzz-no-such-type');
  assert.equal(none.status, 200);
  assert.equal(none.json.total, 0, 'nonexistent type yields 0');
});

test('pagination edges — limit clamped [1..100], huge page empties', async () => {
  const huge = await get('products?limit=99999');
  assert.equal(huge.json.per_page, 100, 'limit clamped to 100 (anti-scrape)');
  const neg = await get('products?limit=-5');
  assert.ok(neg.json.per_page >= 1, 'negative limit clamped to >=1');
  const beyond = await get('products?page=99999&limit=2');
  assert.equal(beyond.status, 200);
  assert.equal(beyond.json.data.length, 0, 'page beyond last returns empty data, not error');
});

test('GET /flash-sale, /store-notices — 200 paginators', async () => {
  for (const ep of ['flash-sale', 'store-notices']) {
    const { status, json } = await get(ep);
    assert.equal(status, 200, `${ep} 200`);
    assertPaginator(json, ep);
  }
});

test('GET /coupons + POST /coupons/verify — contract shape', async () => {
  const list = await get('coupons?limit=5');
  assert.equal(list.status, 200);
  assertPaginator(list.json, 'coupons');
  // verify returns a boolean is_valid regardless of validity (never a 5xx)
  const bad = await post('coupons/verify', { code: 'DEFINITELY-NOT-A-CODE', sub_total: 500 });
  assert.equal(bad.status, 200);
  assert.equal(bad.json.is_valid, false, 'invalid code -> is_valid:false');
});

test('POST /token — 200 on wrong creds but null token (Pickbazar contract)', async () => {
  const { status, json } = await post('token', { email: 'nobody@example.com', password: 'wrong-xyz' });
  assert.equal(status, 200, 'failed login is 200, not 4xx (clients must check token)');
  assert.equal(json.token, null, 'no token issued for bad creds');
  assert.deepEqual(json.permissions, [], 'no permissions for bad creds');
});

test('POST /orders/checkout/verify (guest) — prices in rupees, stable shape', async () => {
  const list = await get('products?limit=1');
  const p = list.json.data[0];
  const price = p.min_price ?? p.price ?? 499;
  const { status, json } = await post('orders/checkout/verify', {
    amount: price,
    products: [{ product_id: p.id, order_quantity: 1, unit_price: price, subtotal: price }],
    billing_address: { city: 'Gurugram' },
    shipping_address: { city: 'Gurugram' },
  });
  assert.equal(status, 200, 'guest checkout verify succeeds');
  for (const k of ['total_tax', 'shipping_charge', 'amount', 'priced_products', 'unavailable_products']) {
    assert.ok(k in json, `checkout/verify has "${k}"`);
  }
  assert.ok(Array.isArray(json.priced_products), 'priced_products is array');
  assert.ok(json.amount >= 20, `amount ${json.amount} in rupees`);
});
