// Presentation config for the PlantAtHome "six worlds". The new /api/v1 backend
// has no vertical/type concept, so the set of worlds is HARDCODED here and each
// maps to a top-level category slug (created by the seed). Slugs are our stable
// identity across re-seeds; category UUIDs are resolved at runtime (useVerticals).

export interface PromiseItem {
  icon: 'truck' | 'shield' | 'spark' | 'leaf' | 'truckFast' | 'droplet' | 'sun';
  t: string;
  d: string;
}

export interface VerticalMeta {
  key: string;
  label: string;
  path: string;
  /** Top-level category slug this world maps to (seed creates it). */
  categorySlug: string;
  tagline: string;
  blurb: string;
  scenes: string[];
  promise: PromiseItem[];
  shopPath?: string;
  comingSoon?: boolean;
}

const PLANTS_PROMISE: PromiseItem[] = [
  { icon: 'truck', t: 'Delivered thriving', d: 'Insulated, water-locked packaging keeps roots happy on every mile.' },
  { icon: 'shield', t: '30-day plant guarantee', d: 'If it doesn’t flourish in the first month, we replace it free.' },
  { icon: 'spark', t: 'Lifetime care support', d: 'Chat with our botanists anytime — watering, light, repotting.' },
];
const TOOLS_PROMISE: PromiseItem[] = [
  { icon: 'shield', t: 'Lifetime warranty', d: 'Forged brass & FSC wood — built to be handed down, not thrown away.' },
  { icon: 'spark', t: 'Ergonomic by design', d: 'Balanced, comfortable tools tested by real gardeners.' },
  { icon: 'truckFast', t: 'Free 2-day shipping', d: 'On every order above ₹999, across India.' },
];
const FARM_PROMISE: PromiseItem[] = [
  { icon: 'truckFast', t: 'Harvested at dawn', d: 'Picked the morning of delivery — never cold-stored for weeks.' },
  { icon: 'leaf', t: '100% certified organic', d: 'No pesticides, no chemicals — just clean, honest produce.' },
  { icon: 'shield', t: 'Freshness promise', d: 'Not fresh? Full refund or a replacement box, no questions.' },
];

const PLANTS_SCENES = ['/plants-1.jpg', '/plants-2.jpg', '/plants-3.jpg'];
const TOOLS_SCENES = ['/tools-1.jpg', '/tools-2.jpg', '/tools-3.jpg'];
const FARM_SCENES = ['/farm-1.jpg', '/farm-2.jpg', '/farm-3.jpg'];

// The six worlds, in nav order. `comingSoon` worlds render an "explore" state.
export const VERTICALS: VerticalMeta[] = [
  {
    key: 'plants',
    label: 'Plants',
    path: '/plants',
    categorySlug: 'plants',
    tagline: 'Bring the wild indoors.',
    blurb: 'Rare foliage, living water-gardens and statement plants — hand-picked by botanists, delivered fresh to your door.',
    scenes: PLANTS_SCENES,
    promise: PLANTS_PROMISE,
  },
  {
    key: 'tools',
    label: 'Tools',
    path: '/tools',
    categorySlug: 'tools',
    tagline: 'Tools that last a lifetime.',
    blurb: 'Premium, ergonomic gardening tools and planters — brass, copper and FSC wood, built to be loved for years.',
    scenes: TOOLS_SCENES,
    promise: TOOLS_PROMISE,
  },
  {
    key: 'farmbox',
    label: 'FarmBox',
    path: '/farmbox',
    categorySlug: 'farmbox',
    tagline: 'Farm-fresh, every week.',
    blurb: 'Organic fruits, vegetables and salad greens — harvested at dawn, delivered to your door the same day.',
    scenes: FARM_SCENES,
    promise: FARM_PROMISE,
  },
  {
    key: 'pots-planters',
    label: 'Pots & Planters',
    path: '/pots-planters',
    categorySlug: 'pots-planters',
    tagline: 'A home for every plant.',
    blurb: 'Terracotta, ceramic and designer planters — handmade finishes that let your greens take centre stage.',
    scenes: ['/tools-3.jpg', '/tools-1.jpg', '/plants-3.jpg'],
    promise: TOOLS_PROMISE,
    comingSoon: true,
  },
  {
    key: 'seeds',
    label: 'Seeds',
    path: '/seeds',
    categorySlug: 'seeds',
    tagline: 'Grow it from day one.',
    blurb: 'Flower, vegetable and herb seeds with germination you can trust — kits and microgreens included.',
    scenes: ['/farm-2.jpg', '/plants-1.jpg', '/farm-3.jpg'],
    promise: PLANTS_PROMISE,
    comingSoon: true,
  },
  {
    key: 'fertilizers',
    label: 'Fertilizers',
    path: '/fertilizers',
    categorySlug: 'fertilizers',
    tagline: 'Feed the roots right.',
    blurb: 'Organic plant food, compost and potting mixes — clean nutrition for soil that stays alive.',
    scenes: ['/farm-3.jpg', '/plants-2.jpg', '/farm-1.jpg'],
    promise: FARM_PROMISE,
    comingSoon: true,
  },
];

export const VERTICAL_SLUGS = VERTICALS.map((v) => v.key);
export const getVertical = (slug: string): VerticalMeta | undefined => VERTICALS.find((v) => v.key === slug);

/** Home hero cinematic scenes (used as CMS-banner fallback). */
export const HOME_SCENES = ['/hero-emerald.jpg', '/hero-villa-interior.jpg', '/hero-glasshouse-dusk.jpg'];

export const TRUST_ITEMS = [
  'Same-day metro delivery',
  '30-day plant guarantee',
  'Expert care support',
  'Carbon-neutral packaging',
  'Hand-picked by botanists',
];

export function formatINR(n?: number | null) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN');
}
