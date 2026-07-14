#!/usr/bin/env node
/**
 * Author POT PRODUCTS on staging — pots are real products (user decision
 * 2026-07-14, superseding the +delta pot-variation design): the PDP "With Pot"
 * picker lists pot products size-matched to the chosen plant size and
 * filterable by material, and the chosen pot is added to the cart as its own
 * line item (admin + API untouched).
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/author-pot-products.mjs [--apply]
 *   (or ADMIN_TOKEN=…)
 *
 * Idempotent: material categories + products are find-or-create by slug.
 * DRY-RUN by default; pass --apply to write.
 *
 * Data model (mirrors how plants are authored on the master shop):
 *  - categories under type pots-planters: Ceramic Pots / Wooden Pots / Plastic Pots
 *  - each pot = variable product on the master `plantathome` shop with the
 *    shop's Size attribute (Small/Medium/Large) and per-size prices, so the
 *    picker can resolve the exact size-matched option + price.
 */

const API = process.env.API_URL || 'https://plantathome-production.up.railway.app/api';
const APPLY = process.argv.includes('--apply');

const MASTER_SHOP_ID = 12; // plantathome (single-shop master catalog)
const POTS_TYPE_ID = 5; // pots-planters
const SIZE_ATTRIBUTE = {
  // shop 12's Size attribute (same one the plants use)
  id: 12,
  values: { Small: 38, Medium: 39, Large: 40 },
};

const img = (u) => ({ original: u, thumbnail: u.replace('w=800', 'w=300') });

const CATEGORIES = [
  { name: 'Ceramic Pots', slug: 'ceramic-pots' },
  { name: 'Wooden Pots', slug: 'wooden-pots' },
  { name: 'Plastic Pots', slug: 'plastic-pots' },
];

const POTS = [
  // material, name, image, prices [S, M, L]
  ['ceramic-pots', 'Terracotta Classic Pot', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80', [249, 349, 499]],
  ['ceramic-pots', 'Glazed Ceramic Planter — Sage', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&q=80', [299, 399, 549]],
  ['ceramic-pots', 'Ribbed Ceramic Planter — Ivory', 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800&q=80', [279, 379, 529]],
  ['wooden-pots', 'Acacia Wood Planter', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', [349, 449, 649]],
  ['wooden-pots', 'Rustic Teak Cube Planter', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80', [399, 549, 749]],
  ['wooden-pots', 'Bamboo Round Planter', 'https://images.unsplash.com/photo-1519336056116-bc0f1771dec8?w=800&q=80', [299, 399, 549]],
  ['plastic-pots', 'Self-Watering Pot — White', 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?w=800&q=80', [99, 149, 199]],
  ['plastic-pots', 'Recycled Planter — Charcoal', 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=800&q=80', [149, 199, 279]],
  ['plastic-pots', 'UV-Safe Pot — Terracotta Finish', 'https://images.unsplash.com/photo-1524594081293-190a2fe0baae?w=800&q=80', [119, 169, 229]],
];

let TOKEN = process.env.ADMIN_TOKEN || '';
const H = () => ({ Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` });
const j = (r) => r.json().catch(() => null);
const slugify = (s) => s.toLowerCase().replace(/[—–]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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
  console.log('✓ authenticated as', ADMIN_EMAIL);
}

async function ensureCategory({ name, slug }) {
  const existing = await fetch(`${API}/categories/${slug}?language=en`, { headers: H() }).then(j);
  if (existing?.id) {
    console.log(`· category ${slug}: exists (id ${existing.id})`);
    return existing.id;
  }
  const body = { name, type_id: POTS_TYPE_ID, language: 'en', details: `${name} — planters that pair with your plants.` };
  if (!APPLY) {
    console.log(`[dry-run] POST /categories ${JSON.stringify(body)}`);
    return -1;
  }
  const res = await fetch(`${API}/categories`, { method: 'POST', headers: H(), body: JSON.stringify(body) }).then(j);
  if (!res?.id) {
    console.error(`✗ category ${slug} create failed:`, JSON.stringify(res).slice(0, 250));
    process.exit(1);
  }
  console.log(`✓ category ${slug} created (id ${res.id})`);
  return res.id;
}

async function ensurePot([catSlug, name, image, prices], catIds) {
  const slug = slugify(name);
  const existing = await fetch(`${API}/products/${slug}?language=en`, { headers: H() }).then(j);
  if (existing?.id) {
    console.log(`· pot ${slug}: exists (id ${existing.id}, ${existing.variation_options?.length ?? 0} options)`);
    return;
  }
  const sizes = ['Small', 'Medium', 'Large'];
  const upsert = sizes.map((size, i) => ({
    title: size,
    price: prices[i],
    quantity: 50,
    sku: `${slug}-${size.toLowerCase()}`,
    is_disable: false,
    options: [{ name: 'Size', value: size }],
  }));
  const body = {
    name,
    description: `${name} — a ${CATEGORIES.find((c) => c.slug === catSlug).name.replace(' Pots', '').toLowerCase()} planter sized to pair with your plant. Drainage-ready and nursery-approved.`,
    type_id: POTS_TYPE_ID,
    shop_id: MASTER_SHOP_ID,
    categories: [catIds[catSlug]],
    product_type: 'variable',
    unit: '1 Pot',
    status: 'publish',
    quantity: 150,
    delivery_charge: 0,
    min_price: Math.min(...prices),
    max_price: Math.max(...prices),
    image: img(image),
    variations: sizes.map((s) => SIZE_ATTRIBUTE.values[s]),
    variation_options: { upsert, delete: [] },
    language: 'en',
  };
  if (!APPLY) {
    console.log(`[dry-run] POST /products ${slug} (${catSlug}, S/M/L = ₹${prices.join('/₹')})`);
    return;
  }
  const res = await fetch(`${API}/products`, { method: 'POST', headers: H(), body: JSON.stringify(body) }).then(j);
  if (!res?.id) {
    console.error(`✗ pot ${slug} create failed:`, JSON.stringify(res).slice(0, 400));
    return;
  }
  const check = await fetch(`${API}/products/${slug}?language=en&with=variation_options`, { headers: H() }).then(j);
  console.log(`✓ pot ${slug} created (id ${res.id}, ${check?.variation_options?.length ?? '?'} options)`);
}

(async () => {
  await login();
  console.log(`${APPLY ? 'APPLYING' : 'DRY-RUN'} — ${CATEGORIES.length} categories, ${POTS.length} pots\n`);
  const catIds = {};
  for (const c of CATEGORIES) catIds[c.slug] = await ensureCategory(c);
  for (const pot of POTS) await ensurePot(pot, catIds);
  console.log('\nDone.');
})();
