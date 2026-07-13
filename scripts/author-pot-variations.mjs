#!/usr/bin/env node
/**
 * Author "With Pot / Without Pot" variations on selected plants — DATA ONLY,
 * via the EXISTING marvel admin endpoints (no API/schema changes).
 *
 *   ADMIN_TOKEN=<sanctum token> node scripts/author-pot-variations.mjs \
 *     --slugs monstera-deliciosa,tulsi --pot-delta 199 --apply
 *
 *   (or ADMIN_EMAIL + ADMIN_PASSWORD to login via POST /token)
 *
 * Behavior per product (idempotent):
 *  - skip if a `pot` attribute group already exists on it
 *  - variable product (e.g. Size S/M/L): every existing option becomes
 *    "<title> / Without Pot" (same price) + a new "<title> / With Pot" option
 *    at price+delta; `variations` gains the two Pot attribute-value ids
 *  - simple product: converted to variable with Without Pot (same price) /
 *    With Pot (price+delta)
 *  - server re-derives order pricing from variation_option_id — tamper-proof.
 *
 * DRY-RUN by default: prints payloads without writing. Pass --apply to write.
 * Verify on ONE product first, check the PDP, then batch.
 */

const API = process.env.API_URL || 'https://plantathome-production.up.railway.app/api';

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : dflt;
};
const APPLY = args.includes('--apply');
const DELTA = Number(getArg('pot-delta', '199'));
const slugsArg = getArg('slugs', '');
const fileArg = getArg('file', '');

let TOKEN = process.env.ADMIN_TOKEN || '';

const H = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
});
const j = (r) => r.json().catch(() => null);

async function login() {
  if (TOKEN) return;
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Provide ADMIN_TOKEN, or ADMIN_EMAIL + ADMIN_PASSWORD.');
    process.exit(1);
  }
  const r = await fetch(`${API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }).then(j);
  if (!r?.token) {
    console.error('Login failed:', JSON.stringify(r).slice(0, 200));
    process.exit(1);
  }
  TOKEN = r.token;
  console.log('✓ authenticated as', ADMIN_EMAIL, 'perms:', (r.permissions || []).join(','));
}

/** Ensure the Pot attribute (+ With/Without values) exists; return value ids. */
async function ensurePotAttribute(shopId) {
  const list = await fetch(`${API}/attributes?language=en`, { headers: H() }).then(j);
  const rows = Array.isArray(list) ? list : list?.data ?? [];
  let pot = rows.find((a) => a?.slug === 'pot' || a?.name?.toLowerCase() === 'pot');
  if (!pot) {
    const body = {
      name: 'Pot',
      shop_id: shopId,
      language: 'en',
      values: [{ value: 'With Pot' }, { value: 'Without Pot' }],
    };
    if (!APPLY) {
      console.log('[dry-run] POST /attributes', JSON.stringify(body));
      return { withPot: -1, withoutPot: -2 };
    }
    pot = await fetch(`${API}/attributes`, { method: 'POST', headers: H(), body: JSON.stringify(body) }).then(j);
    if (!pot?.id) {
      console.error('attribute create failed:', JSON.stringify(pot).slice(0, 300));
      process.exit(1);
    }
    console.log('✓ created Pot attribute id', pot.id);
    // re-GET to pick up value ids
    pot = await fetch(`${API}/attributes/${pot.slug ?? pot.id}?language=en`, { headers: H() }).then(j);
  }
  const values = pot.values ?? [];
  const withPot = values.find((v) => /with\s?pot/i.test(v.value) && !/without/i.test(v.value));
  const withoutPot = values.find((v) => /without\s?pot/i.test(v.value));
  if (!withPot || !withoutPot) {
    console.error('Pot attribute exists but values missing:', JSON.stringify(values));
    process.exit(1);
  }
  console.log(`✓ Pot attribute ready (With Pot=${withPot.id}, Without Pot=${withoutPot.id})`);
  return { withPot: withPot.id, withoutPot: withoutPot.id, attribute: pot };
}

async function authorProduct(slug, potIds) {
  const p = await fetch(
    `${API}/products/${slug}?language=en&searchJoin=and&with=variations.attribute;variation_options;categories;type`,
    { headers: H() },
  ).then(j);
  if (!p?.id) return console.log(`✗ ${slug}: not found`);

  const hasPot = (p.variations ?? []).some((v) => v?.attribute?.slug === 'pot');
  if (hasPot) return console.log(`· ${slug}: already has pot group — skipped`);

  const existingValueIds = (p.variations ?? []).map((v) => v.id);
  const variations = [...existingValueIds, potIds.withPot, potIds.withoutPot];

  const upsert = [];
  if (p.product_type === 'variable' && (p.variation_options ?? []).length) {
    for (const vo of p.variation_options) {
      const baseOpts = vo.options ?? [];
      const basePrice = Number(vo.price);
      const baseSale = vo.sale_price != null && vo.sale_price !== '' ? Number(vo.sale_price) : null;
      // existing option → becomes the Without Pot combo (same price, same id)
      upsert.push({
        id: vo.id,
        title: `${vo.title} / Without Pot`,
        price: basePrice,
        ...(baseSale != null ? { sale_price: baseSale } : {}),
        quantity: vo.quantity,
        sku: vo.sku,
        is_disable: vo.is_disable ?? false,
        options: [...baseOpts, { name: 'Pot', value: 'Without Pot' }],
      });
      // new With Pot combo at +delta
      upsert.push({
        title: `${vo.title} / With Pot`,
        price: basePrice + DELTA,
        ...(baseSale != null ? { sale_price: baseSale + DELTA } : {}),
        quantity: vo.quantity,
        sku: vo.sku ? `${vo.sku}-wp` : undefined,
        is_disable: vo.is_disable ?? false,
        options: [...baseOpts, { name: 'Pot', value: 'With Pot' }],
      });
    }
  } else {
    // simple product → variable with two pot options
    const base = Number(p.sale_price ?? p.price) || 0;
    upsert.push(
      { title: 'Without Pot', price: base, quantity: p.quantity ?? 50, sku: p.sku ? `${p.sku}-np` : undefined, is_disable: false, options: [{ name: 'Pot', value: 'Without Pot' }] },
      { title: 'With Pot', price: base + DELTA, quantity: p.quantity ?? 50, sku: p.sku ? `${p.sku}-wp` : undefined, is_disable: false, options: [{ name: 'Pot', value: 'With Pot' }] },
    );
  }

  const prices = upsert.map((u) => u.sale_price ?? u.price);
  const body = {
    // core fields echoed back (marvel update validates presence)
    name: p.name,
    slug: p.slug,
    description: p.description,
    type_id: p.type_id,
    categories: (p.categories ?? []).map((c) => c.id),
    shop_id: p.shop_id,
    product_type: 'variable',
    unit: p.unit,
    status: p.status,
    quantity: p.quantity,
    min_price: Math.min(...prices),
    max_price: Math.max(...prices),
    variations,
    variation_options: { upsert, delete: [] },
    language: 'en',
  };

  if (!APPLY) {
    console.log(`[dry-run] PUT /products/${p.id} — ${upsert.length} options (${upsert.map((u) => u.title).join(' | ')})`);
    return;
  }
  const res = await fetch(`${API}/products/${p.id}`, { method: 'PUT', headers: H(), body: JSON.stringify(body) }).then(j);
  if (!res?.id) return console.log(`✗ ${slug}: update failed —`, JSON.stringify(res).slice(0, 250));

  const check = await fetch(`${API}/products/${slug}?language=en&with=variations;variation_options`, { headers: H() }).then(j);
  const n = (check?.variation_options ?? []).length;
  console.log(`✓ ${slug}: now ${n} variation options (expected ${upsert.length})`);
}

(async () => {
  const slugs = fileArg
    ? (await import('node:fs')).readFileSync(fileArg, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
    : slugsArg.split(',').map((s) => s.trim()).filter(Boolean);
  if (!slugs.length) {
    console.error('Provide --slugs a,b,c or --file slugs.txt');
    process.exit(1);
  }
  await login();
  const first = await fetch(`${API}/products/${slugs[0]}?language=en`, { headers: H() }).then(j);
  const potIds = await ensurePotAttribute(first?.shop_id ?? 1);
  console.log(`${APPLY ? 'APPLYING' : 'DRY-RUN'} — pot delta ₹${DELTA}, ${slugs.length} product(s)\n`);
  for (const slug of slugs) await authorProduct(slug, potIds);
  console.log('\nDone.');
})();
