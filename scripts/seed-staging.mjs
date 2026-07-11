/**
 * Idempotent staging seeder for plantathome-shop-v2.
 *
 * Mirrors REAL legacy PlantAtHome products (names + public S3 images + prices +
 * categories) from the still-live marvel API into the new /api/v1 catalog, so the
 * v2 storefront shows the same plants/photos/prices as V1 — not placeholders.
 *
 * Safe to re-run: every create is preceded by a GET-and-match on the natural key
 * (slug); pricing/stock/coverage are backend upserts.
 *
 *   node scripts/seed-staging.mjs
 *
 * Env: API_BASE (v1), LEGACY_BASE (marvel), ADMIN_EMAIL, ADMIN_PASSWORD, SEED_NURSERY.
 */

const API = process.env.API_BASE || 'https://plantathome-production.up.railway.app/api/v1';
const LEGACY = process.env.LEGACY_BASE || 'https://plantathome-production.up.railway.app/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@plantathome.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Passw0rd!';
// Proven working seed nursery from the M1 verify loop (registered via coverage below).
const NURSERY = process.env.SEED_NURSERY || '11111111-1111-1111-1111-111111111111';

// Worlds → legacy type slug + how many to mirror. Empty legacy worlds still get a
// top-level category so the vertical exists (renders "coming soon"/empty state).
const WORLDS = [
  { slug: 'plants', name: 'Plants', legacy: 'plants', count: 36, subcats: ['Indoor', 'Outdoor', 'Flowering', 'Air-Purifying', 'Low-Maintenance', 'Succulents'] },
  { slug: 'tools', name: 'Tools', legacy: 'tools', count: 24, subcats: ['Hand Tools', 'Watering', 'Pruning & Cutting', 'Planters'] },
  { slug: 'farmbox', name: 'FarmBox', legacy: 'farmbox', count: 8, subcats: ['Fresh Fruits', 'Vegetables', 'Herbs', 'Salad Greens'] },
  { slug: 'pots-planters', name: 'Pots & Planters', legacy: 'pots-planters', count: 0, subcats: [] },
  { slug: 'seeds', name: 'Seeds', legacy: 'seeds', count: 0, subcats: [] },
  { slug: 'fertilizers', name: 'Fertilizers', legacy: 'fertilizers', count: 0, subcats: [] },
];

const CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Gurugram', 'Pune'];

const HERO_BANNERS = [
  { title: 'Bring the wild indoors', image_url: '/hero-emerald.jpg', link: '/plants' },
  { title: 'A home for every plant', image_url: '/hero-villa-interior.jpg', link: '/pots-planters' },
  { title: 'Farm-fresh, every week', image_url: '/hero-glasshouse-dusk.jpg', link: '/farmbox' },
];

/* ── tiny http helpers ─────────────────────────────────────────────────────── */
let TOKEN = null;
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const THROTTLE_MS = Number(process.env.SEED_DELAY_MS || 350); // pace writes under the API rate limit

async function http(base, path, { method = 'GET', body, auth = false, _try = 0 } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  // Back off + retry on the global rate limit (up to 6 attempts, exp backoff).
  if (res.status === 429 && _try < 6) {
    await sleep(1500 * Math.pow(1.8, _try));
    return http(base, path, { method, body, auth, _try: _try + 1 });
  }
  if (method !== 'GET') await sleep(THROTTLE_MS); // pace writes
  return { status: res.status, json };
}
const v1 = (path, opts = {}) => http(API, path, { ...opts, auth: true });
const legacy = (path) => http(LEGACY, path);
const dataOf = (r) => (r.json && ('data' in r.json ? r.json.data : r.json));

let created = { cats: 0, products: 0, skipped: 0, prices: 0, banners: 0 };
const log = (...a) => console.log(...a);

/* ── steps ─────────────────────────────────────────────────────────────────── */
async function login() {
  const r = await http(API, '/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  const tok = dataOf(r)?.tokens?.access_token;
  if (!tok) throw new Error(`admin login failed (${r.status}): ${JSON.stringify(r.json)?.slice(0, 200)}`);
  TOKEN = tok;
  log('✓ admin authenticated');
}

async function ensureCities() {
  const existing = (dataOf(await v1('/serviceability/cities')) || []).reduce((m, c) => (m.set(c.name.toLowerCase(), c.uuid), m), new Map());
  const uuids = [];
  for (const name of CITIES) {
    let uuid = existing.get(name.toLowerCase());
    if (!uuid) {
      const r = await v1('/serviceability/cities', { method: 'POST', body: { name } });
      uuid = dataOf(r)?.uuid;
      if (uuid) log(`  + city ${name}`);
    }
    if (uuid) {
      uuids.push(uuid);
      // register the seed nursery as serving this city (upsert)
      await v1('/serviceability/coverage', { method: 'PUT', body: { nursery_id: NURSERY, city_uuid: uuid, delivery_radius_km: 0 } });
    }
  }
  log(`✓ ${uuids.length} cities covered by seed nursery`);
  return uuids;
}

// Build a live slug→uuid map of all categories (paginate defensively).
async function loadCategories() {
  const map = new Map();
  const all = dataOf(await v1('/catalog/categories')) || [];
  for (const c of all) map.set(c.slug, c.uuid);
  return map;
}

async function ensureCategory(catMap, { name, slug, parent_uuid = null, sort = 0 }) {
  if (catMap.has(slug)) return catMap.get(slug);
  const r = await v1('/catalog/categories', { method: 'POST', body: { name, slug, parent_uuid, sort, status: 'active' } });
  const uuid = dataOf(r)?.uuid;
  if (!uuid) {
    log(`  ! category ${slug} failed (${r.status})`, JSON.stringify(r.json)?.slice(0, 160));
    return null;
  }
  catMap.set(slug, uuid);
  created.cats++;
  return uuid;
}

// Existing product slugs (so re-runs skip). Paginate a few pages.
async function loadProductSlugs() {
  const slugs = new Set();
  for (let page = 1; page <= 8; page++) {
    const r = await v1(`/catalog/products?limit=100&page=${page}`);
    const rows = dataOf(r) || [];
    for (const p of rows) slugs.add(p.slug);
    const lp = r.json?.meta?.pagination?.last_page ?? 1;
    if (page >= lp || rows.length === 0) break;
  }
  return slugs;
}

async function seedWorld(world, catMap, existingSlugs) {
  // top-level category for the world (always, even if empty)
  const worldCat = await ensureCategory(catMap, { name: world.name, slug: world.slug, sort: 0 });
  if (!world.count || !worldCat) return;

  // pre-create the world's subcategories (for real facets), collect uuids
  const subUuids = [];
  for (const sub of world.subcats || []) {
    const subSlug = slugify(`${world.slug}-${sub}`);
    const u = await ensureCategory(catMap, { name: sub, slug: subSlug, parent_uuid: worldCat, sort: 1 });
    if (u) subUuids.push(u);
  }

  const r = await legacy(`/products?search=type.slug:${world.legacy}&limit=${world.count}`);
  const rows = dataOf(r) || [];
  if (!rows.length) {
    log(`  · ${world.slug}: no legacy products`);
    return;
  }
  log(`  · ${world.slug}: mirroring ${rows.length} legacy products…`);

  let idx = 0;
  for (const p of rows) {
    const slug = slugify((world.slug === 'pots-planters' ? 'pot-' : '') + (p.slug || p.name));
    if (!slug || existingSlugs.has(slug)) {
      created.skipped++;
      idx++;
      continue;
    }
    const img = p.image?.original || p.image?.thumbnail || (Array.isArray(p.gallery) && p.gallery[0]?.original);
    // round-robin into the world's subcategories (legacy list omits categories)
    const categoryUuid = subUuids.length ? subUuids[idx % subUuids.length] : worldCat;
    idx++;
    const price = Number(p.min_price ?? p.price ?? p.max_price) || 199;

    const body = {
      name: p.name,
      slug,
      category_uuid: categoryUuid,
      botanical_name: p.plant_attribute?.botanical_name || null,
      description: typeof p.description === 'string' ? p.description : null,
      status: 'published',
      variants: [
        { size_code: 'M', name: 'Medium', sku: `${slug}-m`.slice(0, 60) },
        { size_code: 'L', name: 'Large', sku: `${slug}-l`.slice(0, 60) },
      ],
      ...(img ? { media: [{ url: img, type: 'image', alt: p.name }] } : {}),
    };

    const cr = await v1('/catalog/products', { method: 'POST', body });
    const prod = dataOf(cr);
    if (!prod?.uuid) {
      log(`    ! ${slug} create failed (${cr.status})`, JSON.stringify(cr.json)?.slice(0, 140));
      continue;
    }
    existingSlugs.add(slug);
    created.products++;

    // publish (syncs the search projection)
    await v1(`/catalog/products/${prod.uuid}/publish`, { method: 'POST' });

    // price + stock per variant (M price, L +40%)
    const variants = prod.variants || [];
    for (let i = 0; i < variants.length; i++) {
      const vUuid = variants[i].uuid;
      const amount = Math.round(price * (i === 0 ? 1 : 1.4));
      await v1('/pricing/base-prices', { method: 'POST', body: { sellable_type: 'variant', sellable_uuid: vUuid, amount, currency: 'INR' } });
      await v1('/inventory/stock', { method: 'PUT', body: { sellable_type: 'variant', sellable_uuid: vUuid, nursery_id: NURSERY, qty_on_hand: 25 } });
      created.prices++;
    }
  }
}

async function ensureBanners() {
  const existing = (dataOf(await v1('/cms/banners?position=home')) || []).map((b) => b.title);
  for (const [i, b] of HERO_BANNERS.entries()) {
    if (existing.includes(b.title)) continue;
    const r = await v1('/cms/banners', { method: 'POST', body: { ...b, position: 'home', sort: i } });
    if (dataOf(r)?.uuid || r.status < 300) created.banners++;
  }
  log(`✓ ${created.banners} home banners ensured`);
}

/* ── run ───────────────────────────────────────────────────────────────────── */
(async () => {
  log(`Seeding ${API}\n`);
  await login();
  await ensureCities();
  const catMap = await loadCategories();
  const existingSlugs = await loadProductSlugs();
  log(`✓ ${catMap.size} categories, ${existingSlugs.size} products already present\n`);

  for (const world of WORLDS) {
    await seedWorld(world, catMap, existingSlugs);
  }
  await ensureBanners();

  log(`\n─────────────────────────────────────────`);
  log(`categories +${created.cats} · products +${created.products} (skipped ${created.skipped}) · price/stock rows +${created.prices} · banners +${created.banners}`);
  log(`Done.`);
})().catch((e) => {
  console.error('\nSEED FAILED:', e.message);
  process.exit(1);
});
