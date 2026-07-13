// Presentation config for the PlantAtHome verticals.
// The set of verticals is DATA-DRIVEN (read from the API types at runtime) so the
// storefront works on any catalogue — staging (plants/tools/farmbox) and
// production (plants/equipment/fresh-fruits) alike. This file only holds the
// cinematic hero scenes / copy / promise bands keyed by slug, with a graceful
// generic fallback for any slug we don't have bespoke art for.

export interface PromiseItem {
  icon:
    | 'truck'
    | 'shield'
    | 'spark'
    | 'leaf'
    | 'truckFast'
    | 'droplet'
    | 'sun';
  t: string;
  d: string;
}

export interface VerticalMeta {
  key: string;
  label: string;
  path: string;
  tagline: string;
  blurb: string;
  scenes: string[];
  promise: PromiseItem[];
  /** Where "shop this world" should land when the vertical page itself has no
      catalogue yet (e.g. pots live under the tools type as a category). */
  shopPath?: string;
  /** True while the vertical exists as a type but has no products/categories. */
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

// Shared by both catalogue spellings of the vertical: staging uses `farmbox`,
// production uses `farm-box`.
const FARMBOX_META = {
  label: 'FarmBox',
  tagline: 'Farm-fresh, every week.',
  blurb:
    'Organic fruits, vegetables and salad greens — harvested at dawn, delivered to your door the same day.',
  scenes: FARM_SCENES,
  promise: FARM_PROMISE,
};

/** Bespoke per-slug presentation. Covers staging + production vertical slugs. */
const META: Record<string, Omit<VerticalMeta, 'key' | 'path'>> = {
  plants: {
    label: 'Plants',
    tagline: 'Bring the wild indoors.',
    blurb:
      'Rare foliage, living water-gardens and statement plants — hand-picked by botanists, delivered fresh to your door.',
    scenes: PLANTS_SCENES,
    promise: PLANTS_PROMISE,
  },
  tools: {
    label: 'Tools',
    tagline: 'Tools that last a lifetime.',
    blurb:
      'Premium, ergonomic gardening tools and planters — brass, copper and FSC wood, built to be loved for years.',
    scenes: TOOLS_SCENES,
    promise: TOOLS_PROMISE,
  },
  equipment: {
    label: 'Equipment',
    tagline: 'Equipment that lasts a lifetime.',
    blurb:
      'Premium gardening tools, planters and accessories — built to be loved for years and handed down.',
    scenes: TOOLS_SCENES,
    promise: TOOLS_PROMISE,
  },
  farmbox: FARMBOX_META,
  'farm-box': FARMBOX_META,
  'fresh-fruits': {
    label: 'Fresh Fruits',
    tagline: 'Farm-fresh, every week.',
    blurb:
      'Sun-ripened seasonal fruit — harvested at its peak and delivered to your door the same day.',
    scenes: FARM_SCENES,
    promise: FARM_PROMISE,
  },
  'pots-planters': {
    label: 'Pots & Planters',
    tagline: 'A home for every plant.',
    blurb:
      'Terracotta, ceramic and designer planters — handmade finishes that let your greens take centre stage.',
    scenes: ['/tools-3.jpg', '/tools-1.jpg', '/plants-3.jpg'],
    promise: TOOLS_PROMISE,
    // The pots catalogue currently lives under the tools type as a category.
    shopPath: '/c/planters-pots',
  },
  seeds: {
    label: 'Seeds',
    tagline: 'Grow it from day one.',
    blurb:
      'Flower, vegetable and herb seeds with germination you can trust — kits and microgreens included.',
    scenes: [
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&q=78&auto=format&fit=crop',
      '/farm-2.jpg',
      '/plants-1.jpg',
    ],
    promise: PLANTS_PROMISE,
    comingSoon: true,
  },
  fertilizers: {
    label: 'Fertilizers',
    tagline: 'Feed the roots right.',
    blurb:
      'Organic plant food, compost and potting mixes — clean nutrition for soil that stays alive.',
    scenes: [
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=78&auto=format&fit=crop',
      '/farm-3.jpg',
      '/plants-2.jpg',
    ],
    promise: FARM_PROMISE,
    comingSoon: true,
  },
};

const titleCase = (slug: string) =>
  slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/**
 * Presentation meta for a vertical slug. Returns bespoke config when we have it,
 * otherwise a premium generic fallback built from the type's name.
 */
export function getVerticalMeta(slug: string, name?: string): VerticalMeta {
  const path = `/${slug}`;
  const bespoke = META[slug];
  if (bespoke) return { key: slug, path, ...bespoke };

  const label = name || titleCase(slug);
  return {
    key: slug,
    path,
    label,
    tagline: `Discover ${label}.`,
    blurb: `Explore our ${label.toLowerCase()} — hand-picked and delivered fresh across India.`,
    scenes: PLANTS_SCENES,
    promise: PLANTS_PROMISE,
  };
}

/** Home hero uses the cinematic luxury penthouse-in-forest scenes. */
export const HOME_SCENES = [
  '/hero-penthouse-1.jpg',
  '/hero-penthouse-2.jpg',
  '/hero-penthouse-3.jpg',
];

export const TRUST_ITEMS = [
  'Same-day metro delivery',
  '30-day plant guarantee',
  'Expert care support',
  'Carbon-neutral packaging',
  'Hand-picked by botanists',
];

export function formatINR(n?: number | null) {
  const v = Number(n ?? 0);
  return '₹' + v.toLocaleString('en-IN');
}
